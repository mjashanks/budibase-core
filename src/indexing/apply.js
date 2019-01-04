import {getIndexedDataKey} from "./sharding";
import {getIndexWriter} from "./serializer";

export const add = async (heirarchy, store, mappedRecord, indexKey, indexNode) => 
    (await getWriter(heirarchy, store, indexKey, indexNode, mappedRecord))
        .addItem(mappedRecord);

export const remove = async (heirarchy, store, mappedRecord, indexKey, indexNode)  => 
    (await getWriter(heirarchy, store, indexKey, indexNode, mappedRecord))
            .removeItem(mappedRecord.key);

export const update = async (heirarchy, store, mappedRecord, indexKey, indexNode) => 
    (await getWriter(heirarchy, store, indexKey, indexNode, mappedRecord))
            .updateItem(mappedRecord);

const getWriter = async (heirarchy, store, indexKey, indexNode, mappedRecord) => {
    const indexedDataKey = getIndexedDataKey(indexNode, indexKey, mappedRecord);
    const readableStream = await store.readableFileStream(indexedDataKey);
    const writableStream = await store.writableFileStream(indexedDataKey);

    return getIndexWriter(
        heirarchy, indexNode, 
        () => readableStream.read(),
        (buffer) => writableStream.write(buffer)
    );
};