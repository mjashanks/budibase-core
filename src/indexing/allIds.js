import {getExactNodeForPath, getParentKey, 
    getFlattenedHierarchy, getNodeByKeyOrNodeKey,
    getNode, isCollection, isAncestor} from "../templateApi/heirarchy";
import {joinKey, safeKey, $} from "../common";
import {join, pull, 
        map, flatten, orderBy,
        filter, find} from "lodash/fp";

const allIdChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-";

const allIdsStringsForFactor = collectionNode => {
    const factor = collectionNode.allidsShardFactor;
    const charRangePerShard = 64 / factor;
    const allIdStrings = [];
    let index = 0;
    let currentIdsShard = "";
    while(index < 64) {
        currentIdsShard = currentIdsShard 
                          + allIdChars[index];
        if((index + 1) % charRangePerShard === 0) {
            allIdStrings.push(currentIdsShard);
            currentIdsShard = "";
        } 
        index++;
    }

    return allIdStrings;
};

export const getAllIdsShardNames = (appHeirarchy, collectionKey) => {
    const collectionNode = getExactNodeForPath(appHeirarchy)
                                              (collectionKey);
    return $(collectionNode,[
        n => n.children,
        map(c => c.recordNodeId),
        map(i => 
            map(c => _allIdsShardKey(collectionKey, i, c))
                (allIdsStringsForFactor(collectionNode))
        ),
        flatten
    ]);
}

const _allIdsShardKey = (collectionKey, childNo, shardKey) => 
    joinKey(
        collectionKey,
        "allids",
        childNo,
        shardKey
    );

export const getAllIdsShardKey = (appHeirarchy, collectionKey, recordId) => {  
    const indexOfFirstDash = recordId.indexOf("-");

    const collectionNode = getExactNodeForPath(appHeirarchy)
                                              (collectionKey);

    const idFirstChar = recordId[indexOfFirstDash + 1];
    const allIdsShardId = $(collectionNode, [
        allIdsStringsForFactor,
        find(i => i.includes(idFirstChar))
    ]);

    return _allIdsShardKey(
        collectionKey, 
        recordId.slice(0, indexOfFirstDash), 
        allIdsShardId)
        
};

const getOrCreateShardFile = async (datastore, allIdsKey) => {
    try {
        return await datastore.loadFile(allIdsKey);
    } catch(eLoad) {
        try {
            await datastore.createFile(allIdsKey, "");
            return "";
        } catch (eCreate) {
            throw new Error(
                "Error loading, then creating allIds " + allIdsKey 
                + " : LOAD : " + eLoad.message 
                + " : CREATE : " + eCreate);
        }
    }
};

const getShardFile = async (datastore, allIdsKey) => {
    try {
        return await datastore.loadFile(allIdsKey);
    } catch(eLoad) {
        return "";
    }
};

export const addToAllIds = (appHeirarchy, datastore) => async record => {
    const allIdsKey = getAllIdsShardKey(
        appHeirarchy,
        getParentKey(record.key()),
        record.id()
    );

    let allIds = await getOrCreateShardFile(datastore, allIdsKey);    

    allIds += `${allIds.length > 0 ? "," : ""}${record.id()}`;

    await datastore.updateFile(allIdsKey, allIds);    
};

export const getAllIdsIterator = (app) => async (collection_Key_or_NodeKey) => {

    collection_Key_or_NodeKey = safeKey(collection_Key_or_NodeKey);
    const targetNode = getNodeByKeyOrNodeKey(
        app.heirarchy,
        collection_Key_or_NodeKey);

    const getAllIdsIteratorForCollectionKey = async (collectionKey) => { 

        const all_allIdsKeys = getAllIdsShardNames(app.heirarchy, collectionKey);
        let shardIndex = 0;
        
        const allIdsFromShardIterator = async () => {

            if(shardIndex === all_allIdsKeys.length)
                return ({done:true, result:{ids:[], collectionKey}});

            const shardKey = all_allIdsKeys[shardIndex];

            const allIds = await getAllIdsFromShard(app.datastore, shardKey);
        
            shardIndex++;
            
            return ({ 
                result: {
                    ids: allIds,
                    collectionKey
                }, 
                done: false });
        };

        return allIdsFromShardIterator;
    };    
    
    const ancestors = $(getFlattenedHierarchy(app.heirarchy), [
        filter(isCollection),
        filter(n => isAncestor(targetNode)(n) 
                    || n.nodeKey() === targetNode.nodeKey()),
        orderBy([n => n.nodeKey().length], ["asc"])
    ]); // parents first

    const traverseForIteraterators = async (currentRecordKey = "", currentNodeIndex = 0) => {
        const currentNode = ancestors[currentNodeIndex];
        const currentCollectionKey = joinKey(
            currentRecordKey,
            currentNode.name
        );
        if(currentNode.nodeKey() === targetNode.nodeKey()) {
            return [
                await getAllIdsIteratorForCollectionKey(
                    currentCollectionKey)];
        }
        const allIterators = [];
        const currentIterator = await getAllIdsIteratorForCollectionKey(
            currentCollectionKey
        );
        
        let ids = await currentIterator();
        while(ids.done === false) {

            for(let id of ids.result.ids) {
                allIterators.push(
                    await traverseForIteraterators(
                        joinKey(currentCollectionKey, id),
                        currentNodeIndex + 1  
                    )
                );
            }
            
            ids = await currentIterator();
        }

        return flatten(allIterators);
    };

    const iteratorsArray = await traverseForIteraterators();
    let currentIteratorIndex = 0;
    return async () => {
        if(iteratorsArray.length === 0)
            return {done:true, result:[]}; 
        const innerResult = await iteratorsArray[currentIteratorIndex]();
        if(!innerResult.done) return innerResult;
        if(currentIteratorIndex == iteratorsArray.length - 1){
            return {done:true, result: innerResult.result};
        }
        currentIteratorIndex++;
        return {done:false, result:innerResult.result};
    };
};

const getAllIdsFromShard = async (datastore, shardKey) => {
    
    const allIdsStr = await getShardFile(datastore, shardKey);

    const allIds = [];
    let currentId = "";
    for (var i = 0; i < allIdsStr.length; i++) {
        let currentChar = allIdsStr.charAt(i);
        const isLast = (i === allIdsStr.length - 1);
        if(currentChar === "," || isLast) {
            if(isLast) currentId += currentChar;
            allIds.push(currentId);
            currentId = "";
        } else {
            currentId += currentChar;
        }
    }
    return allIds;
}

export const removeFromAllIds = (appHeirarchy,datastore) => 
                                async (record) => {
    const shardKey = getAllIdsShardKey(
        appHeirarchy,
        getParentKey(record.key()),
        record.id()
    );
    const allIds = await getAllIdsFromShard(datastore, shardKey);
    
    const newIds = $(allIds, [
        pull(record.id()),
        join(",")
    ]);

    await datastore.updateFile(shardKey, newIds);
};

export default getAllIdsIterator;
