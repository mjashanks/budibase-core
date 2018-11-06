import {getExactNodeForPath} from "../templateApi/heirarchy";
import {getNewFieldValue} from "../types";
import {find, keyBy, mapValues, constant} from "lodash/fp";
import {$, joinKey, safeKey, apiWrapper, events} from "../common";
import {generate} from "shortid";
import {getIndexedDataKey_fromViewKey} from "../indexing/read";

export const deleteView = app => async key => 
    apiWrapper(
        app,
        events.viewApi.delete, 
        {key},
        _deleteView, app, key);

const _deleteView = async (app, key) => {
    const indexedDataFile = getIndexedDataKey_fromViewKey(
        key);

    await app.datastore.deleteFile(
        indexedDataFile
    );
};
