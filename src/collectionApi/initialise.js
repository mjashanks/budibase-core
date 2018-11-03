import {getFlattenedHierarchy, hasNoMatchingAncestors, 
    isRecord, isCollection, getExactNodeForPath, isGlobalView} from "../templateApi/heirarchy";
import {$, allTrue, joinKey, isNothing} from "../common";
import {filter} from "lodash/fp";
import {getIndexedDataKey} from "../indexing/read";
import getIndexing from "../indexing";


const createHeaderedIndexFileIfnotExists = async (app, path, view) => {

    const indexing = getIndexing(app);        
    const indexedDataKey = getIndexedDataKey(path, view);

    if(await app.datastore.exists(indexedDataKey)) return;

    await indexing.createIndexFile(
        indexedDataKey, 
        view.index);
};

const ensureCollectionIsInitialised = async (app, node, path) => {

    await app.datastore.createFolder(path);

    for(let view of node.views) {
        await createHeaderedIndexFileIfnotExists(app, path, view);
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

    const globalViews = $(flatheirarchy, [
        filter(isGlobalView)
    ]);
    
    for(let col of collections) {
        await ensureCollectionIsInitialised(
                app, 
                col, 
                col.pathRegx());
    }

    for(let view of globalViews) {
        await createHeaderedIndexFileIfnotExists(app, "", view);
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