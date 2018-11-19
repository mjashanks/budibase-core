import {readIndex, getIndexedDataKey_fromIndexKey} from "../indexing/read";
import {safeKey, apiWrapper, events} from "../common";

export const listItems = app => async indexKey => 
    apiWrapper(
        app,
        events.indexApi.listItems, 
        {indexKey},
        _listItems, app, indexKey);

const _listItems = async (app, indexKey) => {
    indexKey = safeKey(indexKey);
    const indexedDataKey = getIndexedDataKey_fromIndexKey(indexKey);    
    return await readIndex(app.datastore, indexedDataKey);
};
