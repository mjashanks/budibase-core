import { getHashCode, 
    joinKey} from "../common";
import {getActualKeyOfParent, 
         isGlobalIndex} from "../templateApi/heirarchy";
import {createIndexFile} from "../indexing/sharding";
import {getIndexReader, CONTINUE_READING_RECORDS} from "./serializer";

export const readIndex = async (heirarchy, datastore, index, indexedDataKey) => {
    try {
        const readableStream = await datastore.readableFileStream(indexedDataKey);
        const read = getIndexReader(heirarchy, index, () => readableStream.read());
        const records = [];
        read(item => {
            records.push(item);
            return CONTINUE_READING_RECORDS;
        });
        return records;
    } catch(e) {
        if(await datastore.exists(indexedDataKey)) {
            throw e;
        } else {
            await createIndexFile(datastore)(
                indexedDataKey, 
                index
            );
        }
        return [];
    }
};

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
