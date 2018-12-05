import Papa from "papaparse";
import {isSomething, getHashCode, 
    joinKey} from "../common";
import {getActualKeyOfParent, 
        isGlobalIndex, isShardedIndex,
        getExactNodeForPath} from "../templateApi/heirarchy";

export const readIndex = async(datastore, indexedDataKey) => {
    const file = await datastore.loadFile(indexedDataKey);
    return Papa.parse(
        isSomething(file) ? file : "",
        {header:true}).data;
}

export const getIndexedDataKey_fromIndexKey = (indexKey, record) => {
    return `${indexKey}${indexKey.endsWith(".csv") ? "" : ".csv"}`;
}

export const uniqueIndexName = (index) => 
    "idx_" +
    getHashCode(`${index.filter}${index.map}`) +
    ".csv";

export const getIndexedDataKey = (decendantKey, indexNode) => {

    if(isGlobalIndex(indexNode))
        return `${indexNode.nodeKey()}.csv`

    const indexedDataParentKey = 
            getActualKeyOfParent(
                indexNode.parent().nodeKey()    
                ,decendantKey);

    const indexName = 
        indexNode.name 
        ? `${indexNode.name}.csv`
        : uniqueIndexName(indexNode);

    return joinKey(
        indexedDataParentKey,
        indexName
    );
}
