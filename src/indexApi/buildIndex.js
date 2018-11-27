import {getAllIdsIterator} from "../indexing/allIds";
import {isGlobalIndex, getFlattenedHierarchy
    ,getNodeByKeyOrNodeKey,getNode, isTopLevelCollection,
    isIndex, isCollection, isRecord,
    fieldReversesReferenceToIndex} from "../templateApi/heirarchy";
import {find, filter, some} from "lodash/fp";
import {joinKey, apiWrapper, events, $} from "../common";
import {load} from "../recordApi/load";
import {evaluate} from "../indexing/evaluate";
import {writeIndex} from "../indexing/apply";
import { getIndexedDataKey_fromIndexKey, readIndex } from "../indexing/read";

/*
GlobalIndex:
- iterate all records in system, through collections, and apply index

Top Level Collection Index
- iterate decendant records, and apply index

Collection Index, with record node ancestor
- iterate records of immediate record node ancestor
- foreach, iterate all decendant records and apply index

*/

/** rebuilds an index
 * @param {object} app - the application container
 * @param {string} indexNodeKey - node key of the index, which the index belongs to 
 */
export const buildIndex = app => async (indexNodeKey) => 
    apiWrapper(
        app,
        events.indexApi.buildIndex, 
        {indexNodeKey},
        _buildIndex, app, indexNodeKey);

const _buildIndex = async (app, indexNodeKey) => {
    const indexNode = getNode(app.heirarchy, indexNodeKey);

    if(!isIndex(indexNode)) 
        throw new Error("BuildIndex: must supply a indexnode");

    if(isGlobalIndex(indexNode)) {
        await buildGlobalIndex(
            app, indexNode);
    } else if(isTopLevelCollection(indexNode.parent())) {
        await buildCollectionIndex(
            app, indexNode, indexNode.parent().nodeKey()
        ); 
    }
    else if(isCollection(indexNode.parent())){
        await buildNestedCollectionIndex(
            app, indexNode
        );
    } else if(indexNode.indexType === "reference") {
        await buildReverseReferenceIndex(
            app, indexNode
        );
    }
};

const buildReverseReferenceIndex = async (app, indexNode) => {

    const parentCollectionNode = indexNode.parent().parent();

    const iterateReferencedRecords =
        await getAllIdsIterator(app)
                (parentCollectionNode.nodeKey());
    
    let referencedRecordsIterator = 
        await iterateReferencedRecords();

    // clear out existing indexes
    while(!referencedRecordsIterator.done) {
        const {result} = referencedRecordsIterator;
        for(let id of result.ids) {
            await writeIndex(
                app.datastore, [], 
                joinKey(result.collectionKey, 
                        id, indexNode.name));
        }
        referencedRecordsIterator = await iterateReferencedRecords();
    }

    // Iterate through all referencING records, 
    // and update referenced index for each record

    const referencingNodes = $(app.heirarchy, [
        getFlattenedHierarchy,
        filter(n => isRecord(n)
                    && some(fieldReversesReferenceToIndex(indexNode))
                           (n.fields))
    ]);

    const applyIndexForReferencingNode = async referencingNode => {

        const referencingFields = 
            filter(fieldReversesReferenceToIndex(indexNode))
                  (referencingNode.fields);

        const iterateReferencingNodes = 
            await getAllIdsIterator(app)
                    (referencingNode.parent().nodeKey());

        let referencingIdIterator = await iterateReferencingNodes();
        while(!referencingIdIterator.done) {
            const {result} = referencingIdIterator;
            for(let id of result.ids) {
                const record = await load(app)(
                    joinKey(result.collectionKey, id)
                );

                for(let field of referencingFields) {
                    const referencedKey = record[field.name].key;
                    if(!referencedKey) continue;
                    const indexDataKey = getIndexedDataKey_fromIndexKey(
                        joinKey(referencedKey, indexNode.name)
                    );
                    const indexedData = await readIndex(
                        app.datastore, indexDataKey);
                    applyToIndex(record, indexNode, indexedData);
                    await writeIndex(
                        app.datastore, indexedData, indexDataKey)
                }
            }
            referencingIdIterator = await iterateReferencingNodes();
        }

    };

    for(let referencingNode of referencingNodes) {
        await applyIndexForReferencingNode(referencingNode);
    }

};

const buildGlobalIndex = async (app, indexNode) => {

    const flatHeirarchy = getFlattenedHierarchy(app.heirarchy);
    const filterNodes = pred => filter(pred)(flatHeirarchy);
    
    const topLevelCollections = filterNodes(isTopLevelCollection);

    const indexedData = [];

    for(let col of topLevelCollections) {
        await applyAllDecendantRecords(
            app, 
            col.nodeKey(), indexedData,
            indexNode);
    }
    
    await writeIndex(app.datastore,indexedData, indexNode.nodeKey());

};

const buildCollectionIndex = async (app, indexNode, collectionKey) => {
    const indexedData = [];
    await applyAllDecendantRecords(
        app, 
        collectionKey, 
        indexedData, indexNode
    );
    await writeIndex(
        app.datastore, indexedData, 
        joinKey(collectionKey, indexNode.name));
};

const buildNestedCollectionIndex = async (app, indexNode) => {
    
    const nestedCollection = indexNode.parent();
    const parentCollectionNode = nestedCollection
                            .parent() //record
                            .parent(); //parentcollection

    const allIdsIterator = await getAllIdsIterator(app)
                                                  (parentCollectionNode.nodeKey());

    let allids = await allIdsIterator();
    while(!allids.done) {
        for(let id of allids.result.ids) {
            const collectionKey =
                joinKey(
                    allids.result.collectionKey,
                    id,
                    nestedCollection.name
                );

            await buildCollectionIndex(
                app, indexNode, collectionKey
            );
        }
        allids = await allIdsIterator(); 
    }
}

const chooseChildRecordNodeByKey = (collectionNode, recordId) => 
    find(c => recordId.startsWith(c.collectionChildId))
        (collectionNode.children);

const applyToIndex = (record, indexNode, indexedData) => {
    const result = evaluate(record)(indexNode);
    if(result.passedFilter) 
        indexedData.push(result.result);
};

const applyAllDecendantRecords = 
    async (app, collection_Key_or_NodeKey, indexedData, indexNode) => {

    const collectionNode = 
        getNodeByKeyOrNodeKey(app.heirarchy, collection_Key_or_NodeKey);
    
    const allIdsIterator = await  getAllIdsIterator(app)
                                                   (collection_Key_or_NodeKey);

    const getRecord = async (recordKey) => 
        await load(app)(recordKey);
    
    const buildForIds = async (collectionKey, allIds) => {
        for(let recordId of allIds) {
            const recordKey = joinKey(collectionKey, recordId);
            const record = await getRecord(
                recordKey
            );
            applyToIndex(record, indexNode, indexedData);
            const recordNode = chooseChildRecordNodeByKey(
                collectionNode,
                recordId
            );

            for(let childCollectionNode of recordNode.children) {
                await applyAllDecendantRecords(
                    app,
                    joinKey(recordKey, childCollectionNode.name),
                    indexedData, indexNode);
            }
        }
    };

    let allIds = await allIdsIterator();
    while(allIds.done === false) {
        await buildForIds(
            allIds.result.collectionKey,
            allIds.result.ids);
        allIds = await allIdsIterator();
    }

};



export default buildIndex;