import {safeKey, apiWrapper} from "../common";
import {readIndex, 
    getIndexedDataKey_fromViewKey} from "../indexing/read";

export const listRecords = app => async viewKey => 
    apiWrapper(
        app,
        "collectionApi","listRecords", 
        {viewKey},
        _listRecords, app, viewKey);

const _listRecords = async (app, viewKey) => {
    viewKey = safeKey(viewKey);
    const indexedDataKey = getIndexedDataKey_fromViewKey(viewKey);    
    return await readIndex(app.datastore, indexedDataKey);
};
