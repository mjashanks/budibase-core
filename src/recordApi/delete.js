import {safeKey} from "../common";
import {load} from "./load";

// called deleteRecord because delete is a keyword
export const deleteRecord = (app, indexingApi) => async key => { 
    key = safeKey(key);
    const record = await load(app,indexingApi)(key);
    await app.datastore.deleteFile(key);
    await indexingApi.reindexForDelete(record);
}