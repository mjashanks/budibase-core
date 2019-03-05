import {getExactNodeForPath} from "../templateApi/heirarchy";
import {safeParseField} from "../types";
import {keyBy, mapValues, filter, map, includes,
        constant, last} from "lodash/fp";
import {$, splitKey, safeKey, isNonEmptyString,
    apiWrapper, events, joinKey} from "../common";
import {mapRecord} from "../indexing/evaluate";
import {permission} from "../authApi/permissions";

export const getRecordFileName = key => 
    joinKey(key, "record.json");

export const load = (app) => async key => 
    apiWrapper(
        app,
        events.recordApi.load, 
        permission.readRecord.isAuthorized(key),
        {key},
        _load, app, key);

const _load = async (app, key, keyStack=[]) => {
    key = safeKey(key);
    const recordNode = getExactNodeForPath(app.heirarchy)(key);
    const storedData = await app.datastore.loadJson(
        getRecordFileName(key)
    );
    
    const {type} = storedData;

    const loadedRecord = $(recordNode.fields, [
        keyBy("name"),
        mapValues(f => safeParseField(f, storedData))
    ]);

    const newKeyStack = [...keyStack, key];

    const references = $(recordNode.fields, [
        filter(f => f.type === "reference" 
                    && isNonEmptyString(loadedRecord[f.name].key)
                    && !includes(loadedRecord[f.name].key)(newKeyStack)),
        map(f => ({
            promise:_load(app, loadedRecord[f.name].key, newKeyStack),
            index: getExactNodeForPath(app.heirarchy)(f.typeOptions.indexNodeKey),
            field: f
        }))
    ]);

    if(references.length > 0) {
        const refRecords = await Promise.all(
            map(p => p.promise)(references)
        );

        for(let ref of references) {
            loadedRecord[ref.field.name] = mapRecord(
                refRecords[references.indexOf(ref)], 
                ref.index
            );
        }
    }

    loadedRecord.transactionId = storedData.transactionId;
    loadedRecord.isNew = false;
    loadedRecord.key = key;
    loadedRecord.id = $(key, [splitKey, last]);
    loadedRecord.type = recordNode.name;
    return loadedRecord;
};

export default load;