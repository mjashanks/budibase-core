import {getFlattenedHierarchy, hasNoMatchingAncestors, 
    isCollectionRecord, isRoot,
    isRecord, getExactNodeForPath} from "../templateApi/heirarchy";
import {$, allTrue, joinKey} from "../common";
import {filter} from "lodash/fp";

const ensureCollectionIsInitialised = async (datastore, node, parentKey) => {

    if(!await datastore.exists(parentKey)) {
        await datastore.createFolder(parentKey);
        await datastore.createFolder(
            joinKey(parentKey,"allids")
        );
        await datastore.createFolder(
            joinKey(
                parentKey,
                "allids",
                node.nodeId.toString())
        );
        
    }   
};

export const initialiseRootCollections = async (datastore, heirarchy) => {

    const rootCollectionRecord = 
        allTrue(
            n => isRoot(n.parent()), 
            isCollectionRecord
        );

    const flatheirarchy = getFlattenedHierarchy(heirarchy);

    const collectionRecords = $(flatheirarchy, [
        filter(rootCollectionRecord)
    ]);
    
    for(let col of collectionRecords) {
        await ensureCollectionIsInitialised(
                datastore, 
                col, 
                col.collectionPathRegx());
    }   

};

export const initialiseChildCollections = async (app, recordKey) => {
    const childCollectionRecords = $(recordKey, [
        getExactNodeForPath(app.heirarchy),
        n => n.children,
        filter(isCollectionRecord)
    ]);

    for(let child of childCollectionRecords) {
        await ensureCollectionIsInitialised(
            app.datastore,
            child,
            joinKey(recordKey, child.collectionName)
        );
    }
};