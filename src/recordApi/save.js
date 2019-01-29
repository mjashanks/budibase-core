import {cloneDeep, constant, isEqual,
        flatten, map, filter} from "lodash/fp";
import {initialiseChildCollections,
    initialiseIndex} from "../collectionApi/initialise";
import {validate} from "./validate";
import {load, getRecordFileName} from "./load";
import {apiWrapper, events, $, joinKey} from "../common";
import { getFlattenedHierarchy, getLastPartInKey,
        getExactNodeForPath, isRecord,
        getNode, fieldReversesReferenceToNode} from "../templateApi/heirarchy";
import {mapRecord} from "../indexing/evaluate";
import {listItems} from "../indexApi/listItems";

export const save = (app,indexingApi) => async (record, context) => 
    apiWrapper(
        app,
        events.recordApi.save, 
        {record},
        _save, app,indexingApi, record, context, false);


const _save = async (app,indexingApi, record, context, skipValidation=false) => {
    const recordClone = cloneDeep(record);

    if(!skipValidation) {
        const validationResult = await validate(app)
                                        (recordClone, context);
        if(!validationResult.isValid) {
            app.publish(events.recordApi.save.onInvalid, 
                        {record,validationResult});
            throw new Error("Save : Record Invalid : " 
                    + JSON.stringify(validationResult.errors));
        }
    }

    const returnedClone = cloneDeep(record);
    returnedClone.isNew = constant(false);

    recordClone.type = record.type();
    if(recordClone.isNew()) {
        await app.datastore.createFolder(recordClone.key())
        await app.datastore.createJson(
            getRecordFileName(recordClone.key()), 
            recordClone
        );
        await initialiseReverseReferenceIndexes(app, record);
        await initialiseChildCollections(app, recordClone.key());
        app.publish(events.recordApi.save.onRecordCreated, {
            record:recordClone
        });
        await indexingApi.reindexForCreate(cloneDeep(record));
    }
    else {
        const loadRecord = load(app);
        const oldRecord = await loadRecord(recordClone.key());
        await app.datastore.updateJson(
            getRecordFileName(recordClone.key()), 
            recordClone);
        
        app.publish(events.recordApi.save.onRecordUpdated, {
            old:oldRecord,
            new:returnedClone
        });
        
        await indexingApi.reindexForUpdate(oldRecord, cloneDeep(record));
    }
   
    return returnedClone;
};

const initialiseReverseReferenceIndexes = async (app, record) => {

    const recordNode = getExactNodeForPath(app.heirarchy)
                                          (record.key());

    const indexNodes = 
        $(fieldsThatReferenceThisRecord(app, recordNode), [
            map(f => $(f.typeOptions.reverseIndexNodeKeys, [
                        map(n => getNode(
                                    app.heirarchy,
                                    n))
                    ])
            ),
            flatten
        ]);

    for(let indexNode of indexNodes) {
        await initialiseIndex(
            app, record.key(), indexNode
        );
    }
}

const maintainReferentialIntegrity = 
    async (app, indexingApi, oldRecord, newRecord) => {
    /*
    FOREACH Field that reference this object
    - options Index node that for field
    - has options index changed for referenced record?
    - FOREACH reverse index of field
      - FOREACH referencingRecord in reverse index
        - Is field value still pointing to referencedRecord
        - Update referencingRecord.fieldName to new value 
        - Save
    */
    const recordNode = getExactNodeForPath(app.heirarchy)(newRecord.key());
    const referenceFields = fieldsThatReferenceThisRecord(
        app, recordNode);
    
    const updates = $(referenceFields, [
        map(f => ({
            node: getNode(
                app.heirarchy, f.typeOptions.indexNodeKey),
            field: f
        })),
        map(n => ({
            old: mapRecord(oldRecord, n.node),
            new: mapRecord(newRecord, n.node),
            indexNode: n.node,
            field: n.field,
            reverseIndexKeys: 
                $(n.field.typeOptions.reverseIndexNodeKeys,[
                    map(k => joinKey(
                        newRecord.key(),
                        getLastPartInKey(k)))
                ])  
        })),
        filter(diff => !isEqual(diff.old)(diff.new))
    ]);

    for(let update of updates) {
        for(let reverseIndexKey of update.reverseIndexKeys) {

            const rows = await listItems(app)(reverseIndexKey);

            for(let key of map(r => r.key)(rows)) {
                const record = 
                    await load(app)(key);
                if(record[update.field.name].key === newRecord.key()) {
                    record[update.field.name] = update.new;
                    await _save(app, indexingApi, record, undefined, true);
                }
            }
        }
    }

}

const fieldsThatReferenceThisRecord = (app, recordNode) =>
    $(app.heirarchy, [
        getFlattenedHierarchy,
        filter(isRecord),
        map(n => n.fields),
        flatten,
        filter(fieldReversesReferenceToNode(recordNode))
    ]);
