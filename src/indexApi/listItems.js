import {safeKey, apiWrapper, $,
    events, isNonEmptyString} from "../common";
import {readIndex, searchIndex} from "../indexing/read";
import {getUnshardedIndexDataKey, 
    getShardKeysInRange} from "../indexing/sharding";
import {getExactNodeForPath, isIndex, 
    isShardedIndex} from "../templateApi/heirarchy";
import {flatten, merge} from "lodash/fp";


export const listItems = app => async (indexKey, options) => 
    apiWrapper(
        app,
        events.indexApi.listItems, 
        {indexKey, options},
        _listItems, app, indexKey, options);

const defaultOptions = {rangeStartParams:null, rangeEndParams:null, searchPhrase:null};

const _listItems = async (app, indexKey, options=defaultOptions) => { 
    
    let {searchPhrase, rangeStartParams, rangeEndParams}= 
        $({}, [
            merge(options),
            merge(defaultOptions)
        ]);

    const getItems = async (key) =>
         isNonEmptyString(searchPhrase)
         ? await searchIndex(
             app.heirarchy, 
             app.datastore, 
             indexNode, 
             key, 
             searchPhrase)
         : await readIndex(
             app.heirarchy, 
             app.datastore, 
             indexNode, 
             key);

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
            items.push(await getItems(k));
        }
        return flatten(items);
    } else {
        return await getItems(
            getUnshardedIndexDataKey(indexKey)
        );
    }    
};
