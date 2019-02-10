import {getAllIdsIterator} from "../indexing/allIds";
import {isGlobalIndex, getFlattenedHierarchy
    ,getNodeByKeyOrNodeKey,getNode, isTopLevelCollection,
    isIndex, isCollection, isRecord, isDecendant,
    fieldReversesReferenceToIndex} from "../templateApi/heirarchy";
import {find, filter, includes,
    some, map, join} from "lodash/fp";
import {joinKey, apiWrapper, events, $, allTrue} from "../common";
import {evaluate} from "../indexing/evaluate";
import {initialiseIndex} from "../collectionApi/initialise";
import {deleteIndex} from "../indexApi/delete";
import {serializeItem} from "../indexing/serializer";
import {generateSchema} from "../indexing/indexSchemaCreator";
import {createBuildIndexFolder, 
    transactionForBuildIndex} from "../transactions/create";

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

    await createBuildIndexFolder(app.datastore, indexNodeKey);

    if(!isIndex(indexNode)) 
        throw new Error("BuildIndex: must supply a indexnode");

    if(isGlobalIndex(indexNode)) {
        await buildGlobalIndex(
            app, indexNode);
    } else if(isTopLevelCollection(indexNode.parent())) {
        await buildCollectionIndex(
            app, indexNode.nodeKey(),
            indexNode, indexNode.parent().nodeKey()
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

    await app.cleanupTransactions();
};

const buildReverseReferenceIndex = async (app, indexNode) => {

    // Iterate through all referencING records, 
    // and update referenced index for each record
    let recordCount = 0;
    const referencingNodes = $(app.heirarchy, [
        getFlattenedHierarchy,
        filter(n => isRecord(n)
                    && some(fieldReversesReferenceToIndex(indexNode))
                           (n.fields))
    ]);

    const createTransactionsForReferencingNode = async referencingNode => {

        const iterateReferencingNodes = 
            await getAllIdsIterator(app)
                    (referencingNode.parent().nodeKey());

        let referencingIdIterator = await iterateReferencingNodes();
        while(!referencingIdIterator.done) {
            const {result} = referencingIdIterator;
            for(let id of result.ids) {
                const recordKey = joinKey(result.collectionKey, id);
                await transactionForBuildIndex(app, indexNode.nodeKey, recordKey, recordCount);
                recordCount++;
            }
            referencingIdIterator = await iterateReferencingNodes();
        }

    };

    for(let referencingNode of referencingNodes) {
        await createTransactionsForReferencingNode(referencingNode);
    }
};

const buildGlobalIndex = async (app, indexNode) => {

    const flatHeirarchy = getFlattenedHierarchy(app.heirarchy);
    const filterNodes = pred => filter(pred)(flatHeirarchy);
    
    const topLevelCollections = filterNodes(isTopLevelCollection);
    let totalCount = 0;
    for(let col of topLevelCollections) {
        
        if(!hasApplicableDecendant(app.heirarchy, col, indexNode))
            continue;

        const thisCount = await applyAllDecendantRecords(
            app, 
            col.nodeKey(), 
            indexNode,
            indexNode.nodeKey(),
            [], "", totalCount);

        totalCount = totalCount + thisCount;
    }
};

const tryDeleteIndex = async (app, indexKey) => {
    try {
        await deleteIndex(app)(indexKey);
    }
    catch(_){} // tolerate if already gone
}

const buildCollectionIndex = async (app, indexKey, indexNode, collectionKey) => {
    await tryDeleteIndex(app,indexKey);
    await initialiseIndex(app, collectionKey, indexNode);
    await applyAllDecendantRecords(
        app, 
        collectionKey, 
        indexNode,
        indexKey,
        [] ,""
    );
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

            const indexKey = joinKey(
                collectionKey, indexNode.name);
            await buildCollectionIndex(
                app, indexKey, indexNode, collectionKey
            );
        }
        allids = await allIdsIterator(); 
    }
}

const chooseChildRecordNodeByKey = (collectionNode, recordId) => 
    find(c => recordId.startsWith(c.recordNodeId))
        (collectionNode.children);

const recordNodeApplies = indexNode => recordNode => 
    includes(recordNode.recordNodeId)(indexNode.allowedRecordNodeIds);

const hasApplicableDecendant = (heirarchy, ancestorNode, indexNode) => 
    $(heirarchy, [
        getFlattenedHierarchy,
        filter(
            allTrue(
                isRecord, 
                isDecendant(ancestorNode), 
                recordNodeApplies(indexNode)
            )
        )
    ]);

const applyAllDecendantRecords = 
    async (app, collection_Key_or_NodeKey, 
            indexNode, indexKey, currentIndexedData, 
           currentIndexedDataKey, recordCount=0) => {

    const collectionNode = 
        getNodeByKeyOrNodeKey(app.heirarchy, collection_Key_or_NodeKey);

    const allIdsIterator = await  getAllIdsIterator(app)
                                                   (collection_Key_or_NodeKey);

    
    const createTransactionsForIds = async (collectionKey, allIds) => {

        for(let recordId of allIds) {
            const recordKey = joinKey(collectionKey, recordId);

            const recordNode = chooseChildRecordNodeByKey(
                collectionNode,
                recordId
            );

            if(recordNodeApplies(indexNode)(recordNode)) {
                await transactionForBuildIndex(
                    app, indexNode.nodeKey(), 
                    recordKey, recordCount);
                recordCount++;
            }
            
            if(hasApplicableDecendant(app.heirarchy, recordNode, indexNode))
            {
                for(let childCollectionNode of recordNode.children) {
                    const childCount = await applyAllDecendantRecords(
                        app,
                        joinKey(recordKey, childCollectionNode.name),
                        indexNode, indexKey, currentIndexedData,
                        currentIndexedDataKey, recordCount);
                    
                    recordCount = recordCount + childCount;
                }
            }
        }
    };

    let allIds = await allIdsIterator();
    while(allIds.done === false) {
        await createTransactionsForIds(
            allIds.result.collectionKey,
            allIds.result.ids);
        allIds = await allIdsIterator();
    }
    
    return recordCount;;
};

const writeIndex = async (app, indexedData, indexedDataKey, indexNode) => {
    const schema = generateSchema(app.heirarchy, indexNode);
    const data = $(indexedData, [
        map(i => serializeItem(schema,i)),
        join("")
    ]); 
    
    try{
        await app.datastore.deleteFile(indexedDataKey);
    } catch(_) {}

    await app.datastore.createFile(indexedDataKey, data);
};


export default buildIndex;