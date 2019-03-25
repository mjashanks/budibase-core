import {getFlattenedHierarchy, hasNoMatchingAncestors, 
    isRecord, isCollection, getExactNodeForPath} from "../templateApi/heirarchy";
import {$, allTrue, joinKey} from "../common";
import {filter} from "lodash/fp";

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
    
    for(let col of collections) {
        await ensureCollectionIsInitialised(
                datastore, 
                col, 
                col.pathRegx());
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