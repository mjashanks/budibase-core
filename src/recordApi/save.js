import {cloneDeep, constant, 
        flatten, map, filter,
        includes} from "lodash/fp";
import {initialiseChildCollections,
    createHeaderedIndexFileIfnotExists} from "../collectionApi/initialise";
import {validate} from "./validate";
import {load, getRecordFileName} from "./load";
import {apiWrapper, events, 
        $, isSomething} from "../common";
import { getFlattenedHierarchy, 
        getExactNodeForPath, isRecord,
        getNode } from "../templateApi/heirarchy";

export const save = (app,indexingApi) => async (record, context) => 
    apiWrapper(
        app,
        events.recordApi.save, 
        {record},
        _save, app,indexingApi, record, context);


const _save = async (app,indexingApi, record, context) => {
    const recordClone = cloneDeep(record);

    const validationResult = validate(app)
                                     (recordClone, context);
    if(!validationResult.isValid) {
        app.publish(events.recordApi.save.onInvalid, 
                    {record,validationResult});
        throw new Error("Save : Record Invalid : " + JSON.stringify(validationResult.errors));
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
        await indexingApi.reindexForCreate(recordClone);
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
        
        await indexingApi.reindexForUpdate(oldRecord, recordClone);
    }
   
    return returnedClone;
};

const initialiseReverseReferenceIndexes = async (app, record) => {

    const recordNode = getExactNodeForPath(app.heirarchy)
                                          (record.key());

    const fieldReversesReferenceToHere = f => 
        f.type === "reference"
        && isSomething(f.typeOptions.reverseIndexNodeKey)
        && includes(f.typeOptions.reverseIndexNodeKey)
                   (map(i => i.nodeKey())(recordNode.indexes));

    const indexNodes = $(app.heirarchy, [
        getFlattenedHierarchy,
        filter(isRecord),
        map(n => n.fields),
        flatten,
        filter(fieldReversesReferenceToHere),
        map(f => getNode(
                    app.heirarchy,
                    f.typeOptions.reverseIndexNodeKey))
    ]);

    for(let indexNode of indexNodes) {
        await createHeaderedIndexFileIfnotExists(
            app, record.key(), indexNode
        );
    }
}
