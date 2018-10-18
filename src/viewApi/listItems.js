import {readIndex, getIndexedDataKey_fromViewKey} from "../indexing/read";
import {safeKey} from "../common";

export const listItems = app => async viewKey => {
    viewKey = safeKey(viewKey);
    const indexedDataKey = getIndexedDataKey_fromViewKey(viewKey);    
    return await readIndex(app.datastore, indexedDataKey);
}
