import {getAllIdsIterator} from "../indexing/allIds";
import {isGlobalView, getFlattenedHierarchy
    ,getNodeByKeyOrNodeKey,getNode, isTopLevelCollection,
    isView} from "../templateApi/heirarchy";
import {find, filter} from "lodash/fp";
import {joinKey} from "../common";
import {load} from "../recordApi/load";
import {evaluate} from "../indexing/evaluate";
import {writeIndex} from "../indexing/apply";

/*
GlobalView:
- iterate all records in system, through collections, and apply index

Top Level Collection View
- iterate decendant records, and apply index

Collection View, with record node ancestor
- iterate records of immediate record node ancestor
- foreach, iterate all decendant records and apply index

*/

/** rebuilds an index
 * @param {object} app - the application container
 * @param {string} viewNodeKey - node key of the view, which the index belongs to 
 */
export const buildIndex = app => async (viewNodeKey) => {
    const viewNode = getNode(app.heirarchy, viewNodeKey);

    if(!isView(viewNode)) 
        throw new Error("BuildIndex: must supply a viewnode");

    if(isGlobalView(viewNode)) {
        await buildGlobalViewIndex(
            app, viewNode);
    } else if(isTopLevelCollection(viewNode.parent())) {
        await buildCollectionIndex(
            app, viewNode, viewNode.parent().nodeKey()
        ); 
    }
    else {
        await buildNestedCollectionIndex(
            app, viewNode
        );
    }
};

const buildGlobalViewIndex = async (app, viewNode) => {

    const flatHeirarchy = getFlattenedHierarchy(app.heirarchy);
    const filterNodes = pred => filter(pred)(flatHeirarchy);
    
    const topLevelCollections = filterNodes(isTopLevelCollection);

    const indexedData = [];

    for(let col of topLevelCollections) {
        await applyAllDecendantRecords(
            app, 
            col.nodeKey(), indexedData,
            viewNode);
    }
    
    await writeIndex(app.datastore,indexedData, viewNode.nodeKey());

};

const buildCollectionIndex = async (app, viewNode, collectionKey) => {
    const indexedData = [];
    await applyAllDecendantRecords(
        app, 
        collectionKey, 
        indexedData, viewNode
    );
    await writeIndex(
        app.datastore, indexedData, 
        joinKey(collectionKey, viewNode.name));
};

const buildNestedCollectionIndex = async (app, viewNode) => {
    
    const nestedCollection = viewNode.parent();
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
                app, viewNode, collectionKey
            );
        }
        allids = await allIdsIterator(); 
    }
}

const chooseChildRecordNodeByKey = (collectionNode, recordId) => 
    find(c => recordId.startsWith(c.collectionChildId))
        (collectionNode.children);

const applyAllDecendantRecords = 
    async (app, collection_Key_or_NodeKey, indexedData, viewNode) => {

    const collectionNode = 
        getNodeByKeyOrNodeKey(app.heirarchy, collection_Key_or_NodeKey);
    
    const allIdsIterator = await  getAllIdsIterator(app)
                                                   (collection_Key_or_NodeKey);

    const getRecord = async (recordKey) => 
        await load(app)(recordKey);

    const applyToIndex = record => {
        const result = evaluate(record)(viewNode.index);
        if(result.passedFilter) 
            indexedData.push(result.result);
    };
    
    const buildForIds = async (collectionKey, allIds) => {
        for(let recordId of allIds) {
            const recordKey = joinKey(collectionKey, recordId);
            const record = await getRecord(
                recordKey
            );
            applyToIndex(record);
            const recordNode = chooseChildRecordNodeByKey(
                collectionNode,
                recordId
            );

            for(let childCollectionNode of recordNode.children) {
                await applyAllDecendantRecords(
                    app,
                    joinKey(recordKey, childCollectionNode.name),
                    indexedData, viewNode);
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