import {getAllIdsIterator} from "../indexing/allIds";
import {getFlattenedHierarchy, getRecordNodeById, 
    getCollectionNodeByKeyOrNodeKey, getNode, isIndex, 
    isRecord, isDecendant, getAllowedRecordNodesForIndex,
    fieldReversesReferenceToIndex} from "../templateApi/heirarchy";
import {find, filter, includes,
    some, map} from "lodash/fp";
import {joinKey, apiWrapper, events, $, allTrue} from "../common";
import {createBuildIndexFolder, 
    transactionForBuildIndex} from "../transactions/create";
import {permission} from "../authApi/permissions";


/** rebuilds an index
 * @param {object} app - the application container
 * @param {string} indexNodeKey - node key of the index, which the index belongs to 
 */
export const buildIndex = app => async (indexNodeKey) => 
    apiWrapper(
        app,
        events.indexApi.buildIndex, 
        permission.manageIndex.isAuthorized,
        {indexNodeKey},
        _buildIndex, app, indexNodeKey);

const _buildIndex = async (app, indexNodeKey) => {
    const indexNode = getNode(app.heirarchy, indexNodeKey);

    await createBuildIndexFolder(app.datastore, indexNodeKey);

    if(!isIndex(indexNode)) 
        throw new Error("BuildIndex: must supply a indexnode");

    if(indexNode.indexType === "reference") {
        await buildReverseReferenceIndex(
            app, indexNode
        );
    } else {
        await buildHeirarchalIndex(
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
                    (referencingNode.collectionNodeKey());

        let referencingIdIterator = await iterateReferencingNodes();
        while(!referencingIdIterator.done) {
            const {result} = referencingIdIterator;
            for(let id of result.ids) {
                const recordKey = joinKey(result.collectionKey, id);
                await transactionForBuildIndex(app, indexNode.nodeKey(), recordKey, recordCount);
                recordCount++;
            }
            referencingIdIterator = await iterateReferencingNodes();
        }

    };

    for(let referencingNode of referencingNodes) {
        await createTransactionsForReferencingNode(referencingNode);
    }
};

const getAllowedParentCollectionNodes = (heirarchy, indexNode) => 
    $(getAllowedRecordNodesForIndex(heirarchy, indexNode), [
        map(n => n.parent())
    ]);

const buildHeirarchalIndex = async (app, indexNode) => {

    let recordCount = 0;

    const createTransactionsForIds = async (collectionKey, ids) => {

        for(let recordId of ids) {
            const recordKey = joinKey(collectionKey, recordId);

            const recordNode = getRecordNodeById(
                app.heirarchy,
                recordId
            );

            if(recordNodeApplies(indexNode)(recordNode)) {
                await transactionForBuildIndex(
                    app, indexNode.nodeKey(), 
                    recordKey, recordCount);
                recordCount++;
            }
        }
    };

    
    const collectionRecords = getAllowedRecordNodesForIndex(app.heirarchy, indexNode);

    for(let targetCollectionRecordNode of collectionRecords) {
        const allIdsIterator = await  getAllIdsIterator(app)
                                        (targetCollectionRecordNode.collectionNodeKey());
        
        let allIds = await allIdsIterator();
        while(allIds.done === false) {
            await createTransactionsForIds(
                allIds.result.collectionKey,
                allIds.result.ids);
            allIds = await allIdsIterator();
        }

    }

    return recordCount;
}

const chooseChildRecordNodeByKey = (collectionNode, recordId) => 
    find(c => recordId.startsWith(c.nodeId))
        (collectionNode.children);

const recordNodeApplies = indexNode => recordNode => 
    includes(recordNode.nodeId)(indexNode.allowedRecordNodeIds);

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
        getCollectionNodeByKeyOrNodeKey(
            app.heirarchy, 
            collection_Key_or_NodeKey);

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
                    recordCount = await applyAllDecendantRecords(
                        app,
                        joinKey(recordKey, childCollectionNode.collectionName),
                        indexNode, indexKey, currentIndexedData,
                        currentIndexedDataKey, recordCount);
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

export default buildIndex;