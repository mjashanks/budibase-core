import Papa from "papaparse";
import {isSomething, getHashCode, 
    joinKey} from "../common";
import {getActualKeyOfParent, isGlobalView} from "../templateApi/heirarchy";

export const readIndex = async(datastore, indexedDataKey) => {
    const file = await datastore.loadFile(indexedDataKey);
    return Papa.parse(
        isSomething(file) ? file : "",
        {header:true}).data;
}

export const getIndexedDataKey_fromViewKey = viewKey => 
    `${viewKey}${viewKey.endsWith(".csv") ? "" : ".csv"}`;

const uniqueIndexName = (index) => 
    "idx_" +
    getHashCode(`${index.filter}${index.map}`) +
    ".csv";

export const getIndexedDataKey = (decendantKey, viewNode) => {

    if(isGlobalView(viewNode))
        return `${viewNode.nodeKey()}.csv`

    const indexedDataParentKey = 
            getActualKeyOfParent(
                viewNode.parent().nodeKey()    
                ,decendantKey);

    const indexName = 
        viewNode.name 
        ? `${viewNode.name}.csv`
        : uniqueIndexName(viewNode.index);

    return joinKey(
        indexedDataParentKey,
        indexName
    );
}
