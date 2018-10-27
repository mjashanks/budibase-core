import {getExactNodeForPath} from "../templateApi/heirarchy";
import {getNewFieldValue} from "../types";
import {find, keyBy, mapValues, constant} from "lodash/fp";
import {$, joinKey, safeKey, apiWrapper, events} from "../common";
import {generate} from "shortid";

export const getNew = app => (collectionKey, recordTypeName) => 
    apiWrapper(
        app,
        events.recordApi.getNew, 
        {collectionKey, recordTypeName},
        _getNew, app, collectionKey, recordTypeName);

const _getNew = (app, collectionKey, recordTypeName) => {
    collectionKey = safeKey(collectionKey);
    const collectionNode = getExactNodeForPath(app.heirarchy)(collectionKey);
    const recordNode = find(c => c.name === recordTypeName)
                           (collectionNode.children);

    const record = $(recordNode.fields, [
        keyBy("name"),
        mapValues(getNewFieldValue)
    ]);

    record.id = constant(`${recordNode.collectionChildId}-${generate()}`);
    record.key = constant(joinKey(collectionKey, record.id()));
    record.isNew = constant(true);
    record.type = constant(recordTypeName);
    return record;
};

export const getNewChild = (app) => 
        (recordKey, collectionName, recordTypeName) => 
    getNew(app)(joinKey(recordKey, collectionName), recordTypeName);


