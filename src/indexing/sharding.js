import {getExactNodeForPath, isShardedIndex} from "../templateApi/heirarchy";
import {joinKey, isNonEmptyString, $} from "../common";
import {compileCode} from "@nx-js/compiler-util";
import {filter} from "lodash/fp";

export const getIndexedDataKey = (indexNode, indexKey, record) => {

    const getShardName = (indexNode, record) => 
        compileCode(indexNode.getShardName)(record);
    
    const shardName = isNonEmptyString(indexNode.getShardName)
                      ? getShardName(indexNode, record)
                      : "index.csv";
        
    return joinKey(indexKey, shardName);    
}

export const getShardKeysInRange = async (app, indexKey, startRecord=null, endRecord=null) => {

    const startKey = getIndexedDataKey(app.heirarchy, indexKey, startRecord);
    const endKey = getIndexedDataKey(app.heirarchy, indexKey, endRecord);
    const shardMapKey = getShardMapKey(indexKey);

    return $(await app.datastore.loadJson(shardMapKey),[
        filter(k => (startKey === null || k >= startKey) 
                    && (endKey === null || k <= endKey)),
        map(k => joinKey(indexKey, k))
    ]);
};

export const getAllShardKeys = async (app, indexKey) => 
    await getShardKeysInRange(app, indexKey);

export const getShardMapKey = indexKey => 
    joinKey(indexKey, "shardMap.json");
    
export const getUnshardedIndexDataKey = indexKey =>
    joinKey(indexKey, "index.csv");

export const getIndexFolderKey = indexKey => indexKey;
