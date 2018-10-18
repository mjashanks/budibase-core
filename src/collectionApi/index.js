import {getExactNodeForPath} from "../templateApi/heirarchy";
import {isNothing, safeKey} from "../common";
import {map} from "lodash/fp";
import {readIndex, 
    getIndexedDataKey_fromViewKey} from "../indexing/read";
import {initialiseAll} from "./initialise";
import {getAllIdsIterator} from "../indexing/allIds";

const listRecords = app => async viewKey => {
    viewKey = safeKey(viewKey);
    const indexedDataKey = getIndexedDataKey_fromViewKey(viewKey);    
    return await readIndex(app.datastore, indexedDataKey);
};

const getAllowedRecordTypes = (app) => (key) => {
    key = safeKey(key);
    const node = getExactNodeForPath(app.heirarchy)(key);
    return isNothing(node) ? [] : map(c => c.name)(node.children);
};

export const getCollectionApi = app => ({
    initialiseAll : initialiseAll(app),
    listRecords : listRecords(app),
    getAllowedRecordTypes : getAllowedRecordTypes(app),
    getAllIdsIterator : getAllIdsIterator(app),
    _store : app.datastore
});

export default getCollectionApi;