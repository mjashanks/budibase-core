import {getActualKeyOfParent, isGlobalIndex, 
        getParentKey ,isShardedIndex,
        getExactNodeForPath} from "../templateApi/heirarchy";
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

    const indexNode = getExactNodeForPath(app.heirarchy)
                                         (indexKey);

    const startShardName = !startRecord 
                           ? null 
                           : shardNameFromKey(
                                getIndexedDataKey(
                                    indexNode, 
                                    indexKey, 
                                    startRecord)
                             );

    const endShardName = !endRecord 
                         ? null 
                         : shardNameFromKey(
                            getIndexedDataKey(
                                indexNode, 
                                indexKey, 
                                endRecord)
                           );

    return $(await getShardMap(app.datastore, indexKey),[
        filter(k => (startRecord === null || k >= startShardName) 
                    && (endRecord === null || k <= endShardName)),
        map(k => joinKey(indexKey, k + ".csv"))
    ]);
};

export const getShardMap = async (datastore, indexKey) => {
    const shardMapKey = getShardMapKey(indexKey);
    try {
        return await datastore.loadJson(shardMapKey);
    } catch(_) {
        await datastore.createJson(shardMapKey, []);
        return [];
    }
}

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
