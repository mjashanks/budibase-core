import {safeKey, apiWrapper, 
    events, joinKey, $} from "../common";
import {load, getRecordFileName} from "./load";
import {deleteCollection} from "../collectionApi/delete";
import {getExactNodeForPath} from "../templateApi/heirarchy";

export const deleteRecord = (app, indexingApi) => async (key, applyIndex = true) => 
    apiWrapper(
        app,
        events.recordApi.delete, 
        {key},
        _deleteRecord, app, indexingApi, key, applyIndex);

// called deleteRecord because delete is a keyword
const _deleteRecord = async (app, indexingApi, key, applyIndex) => { 
    key = safeKey(key);
    const node = getExactNodeForPath(app.heirarchy)(key);
    const record = await load(app,indexingApi)(key);
    await app.datastore.deleteFile(
        getRecordFileName(key));
    
    if(applyIndex) {
        await indexingApi.reindexForDelete(record);
    }
    
    for(let collection of node.children) {
        const collectionKey = joinKey(
            key, collection.name
        );
        await deleteCollection(app)(collectionKey);
    }

    await app.datastore.deleteFolder(key);
};