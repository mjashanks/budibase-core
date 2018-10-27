import {safeKey, apiWrapper} from "../common";
import {load} from "./load";

export const deleteRecord = (app, indexingApi) => async key => 
    apiWrapper(
        app,
        "recordApi","deleteRecord", 
        {key},
        _deleteRecord, app, indexingApi, key);

// called deleteRecord because delete is a keyword
const _deleteRecord = async (app, indexingApi, key) => { 
    key = safeKey(key);
    const record = await load(app,indexingApi)(key);
    await app.datastore.deleteFile(key);
    await indexingApi.reindexForDelete(record);
};