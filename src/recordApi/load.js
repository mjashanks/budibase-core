import {getExactNodeForPath} from "../templateApi/heirarchy";
import {safeParseField} from "../types";
import {keyBy, mapValues, constant, last} from "lodash/fp";
import {$, splitKey, safeKey, apiWrapper, events} from "../common";

export const load = (app) => async key => 
    apiWrapper(
        app,
        events.recordApi.load, 
        {key},
        _load, app, key);

const _load = async (app, key) => {
    key = safeKey(key);
    const recordNode = getExactNodeForPath(app.heirarchy)(key);
    const storedData = await app.datastore.loadJson(key);
    
    const {type} = storedData;

    const loadedRecord = $(recordNode.fields, [
        keyBy("name"),
        mapValues(f => safeParseField(f, storedData))
    ]);

    loadedRecord.isNew = constant(false);
    loadedRecord.key = constant(key);
    loadedRecord.id = $(key, [splitKey, last, constant]);
    loadedRecord.type = constant(type);
    return loadedRecord;
};

export default load;