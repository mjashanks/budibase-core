import {getActualKeyOfParent, isGlobalIndex, 
        getParentKey ,isShardedIndex} from "../templateApi/heirarchy";
import {joinKey, isNonEmptyString, splitKey, $} from "../common";
import {compileCode} from "@nx-js/compiler-util";
import {filter, keys, map, last} from "lodash/fp";
import {mapRecord} from "./evaluate";
import {unparse} from "papaparse";

export const getIndexedDataKey = (indexNode, indexKey, record) => {

    const getShardName = (indexNode, record) => 
        compileCode(indexNode.getShardName)({record});
    
    const shardName = isNonEmptyString(indexNode.getShardName)
                      ? `${getShardName(indexNode, record)}.csv`
                      : "index.csv";
        
    return joinKey(indexKey, shardName);    
}

export const getShardKeysInRange = async (app, indexKey, startRecord=null, endRecord=null) => {

    const startKey = getIndexedDataKey(app.heirarchy, indexKey, startRecord);
    const endKey = getIndexedDataKey(app.heirarchy, indexKey, endRecord);

    return $(await getShardMap(app.datastore, indexKey),[
        filter(k => (startKey === null || k >= startKey) 
                    && (endKey === null || k <= endKey)),
        map(k => joinKey(indexKey, k))
    ]);
};

export const getShardMap = async (datastore, indexKey) =>
    await datastore.loadJson(
        getShardMapKey(indexKey)
    );

export const writeShardMap = async (datastore, indexKey, shardMap) => 
    await datastore.updateJson(
        getShardMapKey(indexKey),
        shardMap
    );

export const getAllShardKeys = async (app, indexKey) => 
    await getShardKeysInRange(app, indexKey);

export const getShardMapKey = indexKey => 
    joinKey(indexKey, "shardMap.json");
    
export const getUnshardedIndexDataKey = indexKey =>
    joinKey(indexKey, "index.csv");

export const getIndexFolderKey = indexKey => indexKey;

export const createIndexFile = (datastore) => async (indexedDataKey, index) => {
    const dummyMapped = mapRecord({}, index);
    const indexCsv_headerOnly = unparse([keys(dummyMapped)]);
    if(isShardedIndex(index)) {
        const indexKey = getParentKey(indexedDataKey);
        const shardMap = await getShardMap(datastore, indexKey);
        shardMap.push(
            shardNameFromKey(indexedDataKey)
        );
        await writeShardMap(datastore, indexKey, shardMap);
    }
    await datastore.createFile(indexedDataKey, indexCsv_headerOnly);
};

export const shardNameFromKey = key => 
    $(key,[
        splitKey,
        last
    ]).replace(".csv","");

export const getIndexKey_BasedOnDecendant = (decendantKey, indexNode) => {

    if(isGlobalIndex(indexNode))
        return `${indexNode.nodeKey()}`

    const indexedDataParentKey = 
            getActualKeyOfParent(
                indexNode.parent().nodeKey()    
                ,decendantKey);

    return joinKey(
        indexedDataParentKey,
        indexNode.name
    );
};
