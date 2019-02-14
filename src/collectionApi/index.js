import {initialiseAll} from "./initialise";
import {getAllIdsIterator} from "../indexing/allIds";
import {getAllowedRecordTypes} from "./getAllowedRecordTypes";
import {deleteCollection} from "./delete";

export const getCollectionApi = app => ({
    initialiseAll : initialiseAll(app),
    getAllowedRecordTypes : getAllowedRecordTypes(app),
    getAllIdsIterator : getAllIdsIterator(app),
    delete: deleteCollection(app),
    _store : app.datastore
});

export default getCollectionApi;