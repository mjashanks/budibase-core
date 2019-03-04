import {getExactNodeForPath} from "../templateApi/heirarchy";
import {getNewFieldValue} from "../types";
import {find, keyBy, mapValues, constant} from "lodash/fp";
import {$, joinKey, safeKey, apiWrapperSync, events} from "../common";
import {generate} from "shortid";

export const getNew = app => (collectionKey, recordTypeName) => 
    apiWrapperSync(
        app,
        events.recordApi.getNew, 
        {collectionKey, recordTypeName},
        _getNew, app, collectionKey, recordTypeName);

const _getNew = (app, collectionKey, recordTypeName) => {
    collectionKey = safeKey(collectionKey);
    const collectionNode = getExactNodeForPath(app.heirarchy)(collectionKey);
    const recordNode = find(c => c.name === recordTypeName)
                           (collectionNode.children);

    return constructRecord(recordNode, getNewFieldValue, collectionKey);
};

export const getNewChild = (app) => 
        (recordKey, collectionName, recordTypeName) => 
    getNew(app)(joinKey(recordKey, collectionName), recordTypeName);

export const constructRecord = (recordNode, getFieldValue, collectionKey) => {
    const record = $(recordNode.fields, [
        keyBy("name"),
        mapValues(getFieldValue)
    ]);

    record.id = `${recordNode.recordNodeId}-${generate()}`;
    record.key = joinKey(collectionKey, record.id);
    record.isNew = true;
    record.type = recordNode.name;
    return record;
};