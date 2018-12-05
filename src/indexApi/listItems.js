import {safeKey, apiWrapper, $,
    events} from "../common";
import {readIndex} from "../indexing/read";
import {getUnshardedIndexDataKey, 
    getShardKeysInRange} from "../indexing/sharding";
import {getExactNodeForPath, isIndex, 
    isShardedIndex} from "../templateApi/heirarchy";
import {flatten} from "lodash/fp";


export const listItems = app => async (indexKey, rangeStartParams=null, rangeEndParams=null) => 
    apiWrapper(
        app,
        events.indexApi.listItems, 
        {indexKey},
        _listItems, app, indexKey, rangeStartParams, rangeEndParams);

const _listItems = async (app, indexKey, rangeStartParams, rangeEndParams) => {
    indexKey = safeKey(indexKey);
    const indexNode = getExactNodeForPath(app.heirarchy)(indexKey);

    if(!isIndex(indexNode))
        throw new Error("supplied key is not an index");

    if(isShardedIndex(indexNode)) {
        const shardKeys = await getShardKeysInRange(
            app, indexKey, rangeStartParams, rangeEndParams
        );
        const items = [];
        for(let k of shardKeys) {
            items.push(await readIndex(app.datastore, k));
        }
        return flatten(items);
    } else {
        return await readIndex(
            app.datastore, 
            getUnshardedIndexDataKey(indexKey)
        );
    }    
};
