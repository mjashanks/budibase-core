import {getExactNodeForPath} from "../templateApi/heirarchy";
import {getNewFieldValue} from "../types";
import {find, keyBy, mapValues, constant} from "lodash/fp";
import {$, joinKey, safeKey, apiWrapper, events} from "../common";
import {generate} from "shortid";
import {getIndexedDataKey_fromIndexKey} from "../indexing/read";

export const deleteIndex = app => async key => 
    apiWrapper(
        app,
        events.indexApi.delete, 
        {key},
        _deleteIndex, app, key);

const _deleteIndex = async (app, key) => {
    const indexedDataFile = getIndexedDataKey_fromIndexKey(
        key);

    await app.datastore.deleteFile(
        indexedDataFile
    );
};
