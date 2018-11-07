import {safeKey, apiWrapper, 
    events, joinKey, $} from "../common";
import {load, getRecordFileName} from "./load";
import {deleteCollection} from "../collectionApi/delete";
import {getExactNodeForPath} from "../templateApi/heirarchy";

export const deleteRecord = (app, indexingApi) => async (key) => 
    apiWrapper(
        app,
        events.recordApi.delete, 
        {key},
        _deleteRecord, app, indexingApi, key);

// called deleteRecord because delete is a keyword
const _deleteRecord = async (app, indexingApi, key) => { 
    key = safeKey(key);
    const node = getExactNodeForPath(app.heirarchy)(key);
    
    for(let collection of node.children) {
        const collectionKey = joinKey(
            key, collection.name
        );
        await deleteCollection(app)(collectionKey);
    }

    const record = await load(app)(key);
    await app.datastore.deleteFile(
        getRecordFileName(key));
    
    await indexingApi.reindexForDelete(record);

    await app.datastore.deleteFolder(key);
};