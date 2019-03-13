import {getFlattenedHierarchy, hasNoMatchingAncestors, 
    isRecord, isCollection, isShardedIndex, 
    getExactNodeForPath, isGlobalIndex} from "../templateApi/heirarchy";
import {$, allTrue, joinKey} from "../common";
import {filter} from "lodash/fp";
import {getShardMapKey, getUnshardedIndexDataKey, createIndexFile} from "../indexing/sharding";

export const initialiseIndex = async (datastore, parentKey, index) => {
    const indexKey = joinKey(parentKey, index.name);

    await datastore.createFolder(indexKey);

    if(isShardedIndex(index)) {
        await datastore.createFile(
            getShardMapKey(indexKey),
            "[]"
        );
    } else {
        await createIndexFile(
            datastore,
            getUnshardedIndexDataKey(indexKey), 
            index
        );
    }
};

const ensureCollectionIsInitialised = async (datastore, node, parentKey) => {

    if(!await datastore.exists(parentKey)) {
        await datastore.createFolder(parentKey);
        await datastore.createFolder(
            joinKey(parentKey,"allids")
        );
        for(let childRecord of node.children) {
            await datastore.createFolder(
                joinKey(
                    parentKey,
                    "allids",
                    childRecord.recordNodeId.toString())
            );
        }
    }
    

    for(let index of node.indexes) {
        const indexKey = joinKey(parentKey, index.name);
        if(!await datastore.exists(indexKey))
            await initialiseIndex(datastore, parentKey, index);
    }    
};

export const initialiseRootCollections = async (datastore, heirarchy) => {

    const collectionThatIsNotAnAncestorOfARecord = 
        allTrue(
            hasNoMatchingAncestors(isRecord), 
            isCollection
        );

    const flatheirarchy = getFlattenedHierarchy(heirarchy);

    const collections = $(flatheirarchy, [
        filter(collectionThatIsNotAnAncestorOfARecord)
    ]);

    const globalIndexes = $(flatheirarchy, [
        filter(isGlobalIndex)
    ]);
    
    for(let col of collections) {
        await ensureCollectionIsInitialised(
                datastore, 
                col, 
                col.pathRegx());
    }

    for(let index of globalIndexes) {
        if(!await datastore.exists(index.nodeKey()))
            await initialiseIndex(datastore, "", index);
    }    

};

export const initialiseChildCollections = async (app, recordKey) => {
    const childCollections = $(recordKey, [
        getExactNodeForPath(app.heirarchy),
        n => n.children,
        filter(isCollection)
    ]);

    for(let child of childCollections) {
        await ensureCollectionIsInitialised(
            app.datastore,
            child,
            joinKey(recordKey, child.name)
        );
    }
};