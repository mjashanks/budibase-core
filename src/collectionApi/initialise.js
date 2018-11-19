import {getFlattenedHierarchy, hasNoMatchingAncestors, 
    isRecord, isCollection, getExactNodeForPath, isGlobalIndex} from "../templateApi/heirarchy";
import {$, allTrue, joinKey} from "../common";
import {filter} from "lodash/fp";
import {getIndexedDataKey} from "../indexing/read";
import getIndexing from "../indexing";


const createHeaderedIndexFileIfnotExists = async (app, path, index) => {

    const indexing = getIndexing(app);        
    const indexedDataKey = getIndexedDataKey(path, index);

    if(await app.datastore.exists(indexedDataKey)) return;

    await indexing.createIndexFile(
        indexedDataKey, 
        index);
};

const ensureCollectionIsInitialised = async (app, node, path) => {

    if(!await app.datastore.exists(path)) {
        await app.datastore.createFolder(path);
        await app.datastore.createFolder(
            joinKey(path,"allids")
        );
        for(let childRecord of node.children) {
            await app.datastore.createFolder(
                joinKey(
                    path,
                    "allids",
                    childRecord.collectionChildId.toString())
            );
        }
    }
    

    for(let index of node.indexes) {
        await createHeaderedIndexFileIfnotExists(app, path, index);
    }    
}

export const initialiseAll = app => async () => {

    const collectionThatIsNotAnAncestorOfARecord = 
        allTrue(
            hasNoMatchingAncestors(isRecord), 
            isCollection
        );

    const flatheirarchy = getFlattenedHierarchy(app.heirarchy);

    const collections = $(flatheirarchy, [
        filter(collectionThatIsNotAnAncestorOfARecord)
    ]);

    const globalIndexes = $(flatheirarchy, [
        filter(isGlobalIndex)
    ]);
    
    for(let col of collections) {
        await ensureCollectionIsInitialised(
                app, 
                col, 
                col.pathRegx());
    }

    for(let index of globalIndexes) {
        await createHeaderedIndexFileIfnotExists(app, "", index);
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
            app,
            child,
            joinKey(recordKey, child.name)
        );
    }
};