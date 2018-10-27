import {readIndex, getIndexedDataKey_fromViewKey} from "../indexing/read";
import {safeKey, apiWrapper} from "../common";

export const listItems = app => async viewKey => 
    apiWrapper(
        app,
        "viewApi","listItems", 
        {viewKey},
        _listItems, app, viewKey);

const _listItems = async (app, viewKey) => {
    viewKey = safeKey(viewKey);
    const indexedDataKey = getIndexedDataKey_fromViewKey(viewKey);    
    return await readIndex(app.datastore, indexedDataKey);
};
