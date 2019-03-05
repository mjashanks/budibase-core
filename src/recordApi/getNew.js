import {getExactNodeForPath} from "../templateApi/heirarchy";
import {getNewFieldValue} from "../types";
import {find, keyBy, mapValues, constant} from "lodash/fp";
import {$, joinKey, safeKey, apiWrapperSync, events} from "../common";
import {generate} from "shortid";
import {permission} from "../authApi/permissions";

export const getNew = app => (collectionKey, recordTypeName) => {
    const recordNode = getRecordNode(app, collectionKey, recordTypeName);
    return apiWrapperSync(
        app,
        events.recordApi.getNew, 
        permission.createRecord.isAuthorized(recordNode.nodeKey()),
        {collectionKey, recordTypeName},
        _getNew, recordNode, collectionKey);
}

const _getNew = (recordNode, collectionKey) => 
    constructRecord(recordNode, getNewFieldValue, collectionKey);

const getRecordNode = (app, collectionKey, recordTypeName) => {
    collectionKey = safeKey(collectionKey);
    const collectionNode = getExactNodeForPath(app.heirarchy)(collectionKey);
    return find(c => c.name === recordTypeName)
                (collectionNode.children);
}

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
