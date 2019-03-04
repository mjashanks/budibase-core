import {getExactNodeForPath} from "../templateApi/heirarchy";
import {isNothing, safeKey, apiWrapperSync, events} from "../common";
import {map} from "lodash/fp";

export const getAllowedRecordTypes = (app) => (key) => 
    apiWrapperSync(
        app,
        events.collectionApi.getAllowedRecordTypes, 
        {key},
        _getAllowedRecordTypes, app, key);


const _getAllowedRecordTypes = (app, key) => {
    key = safeKey(key);
    const node = getExactNodeForPath(app.heirarchy)(key);
    return isNothing(node) ? [] : map(c => c.name)(node.children);
};