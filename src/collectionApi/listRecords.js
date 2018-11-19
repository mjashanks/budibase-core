import {safeKey, apiWrapper, events} from "../common";
import {readIndex, 
    getIndexedDataKey_fromIndexKey} from "../indexing/read";

export const listRecords = app => async indexKey => 
    apiWrapper(
        app,
        events.collectionApi.listRecords, 
        {indexKey},
        _listRecords, app, indexKey);

const _listRecords = async (app, indexKey) => {
    indexKey = safeKey(indexKey);
    const indexedDataKey = getIndexedDataKey_fromIndexKey(indexKey);    
    return await readIndex(app.datastore, indexedDataKey);
};
