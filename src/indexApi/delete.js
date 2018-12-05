import {getNewFieldValue} from "../types";
import {find, keyBy, mapValues, constant} from "lodash/fp";
import {$, joinKey, safeKey, apiWrapper, events} from "../common";
import {isIndex, isShardedIndex, 
        getExactNodeForPath} from "../templateApi/heirarchy";
import {getShardMapKey, getAllShardKeys, 
        getUnshardedIndexDataKey} from "../indexing/sharding";

export const deleteIndex = app => async indexKey => 
    apiWrapper(
        app,
        events.indexApi.delete, 
        {indexKey},
        _deleteIndex, app, indexKey);

const _deleteIndex = async (app, indexKey) => {
    const indexNode = getExactNodeForPath(app.heirarchy)(indexKey);
    
    if(!isIndex(indexNode))
        throw new Error("Supplied key is not an index");
    
    if(isShardedIndex(indexNode)) {
        const shardKeys = await getAllShardKeys(app, indexKey);
        for(let k of shardKeys) {
            await app.datastore.deleteFile(k);
        }
    } else {
        await app.datastore.deleteFile(
            getUnshardedIndexDataKey(indexKey)
        );
    }

    await app.datastore.deleteFolder(indexKey);
};
