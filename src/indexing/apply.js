import Papa from "papaparse";
import {find, pull, merge, isString} from "lodash";
import {readIndex} from "./read";
import {getIndexedDataKey} from "./sharding";
// refactor write and read
const writeIndex = async (datastore, indexedData, 
                                indexedDataKey) => {
    const indexContents = Papa.unparse(indexedData);

    if(await datastore.exists(indexedDataKey)) {
        await datastore.updateFile(
            indexedDataKey, 
            indexContents);
    } else {
        await datastore.createFile(
            indexedDataKey, 
            indexContents);
    }
};

const compareKey = mappedRecord => i => i.key === mappedRecord.key; 


export const add = async (store, mappedRecord, indexKey, indexNode) => {
    const indexedDataKey = getIndexedDataKey(indexNode, indexKey, mappedRecord);
    const indexedData = await readIndex(store, indexedDataKey);
    indexedData.push(mappedRecord);
    await writeIndex(store, indexedData, indexedDataKey);
};

export const remove = async (store, mappedRecord, indexKey, indexNode)  => {
    const indexedDataKey = getIndexedDataKey(indexNode, indexKey, mappedRecord);
    const indexedData = await readIndex(store, indexedDataKey);
    // using pull to mutate on purpose, so we dont have a copy of the array
    // (which may be large)
    pull(indexedData, 
         find(indexedData, compareKey(mappedRecord))
    );

    await writeIndex(store, indexedData, indexedDataKey);
};

export const update = async (store, mappedRecord, indexKey, indexNode) => {
    const indexedDataKey = getIndexedDataKey(indexNode, indexKey, mappedRecord);
    const indexedData = await readIndex(store, indexedDataKey);

    merge(
        find(indexedData, compareKey(mappedRecord)),
        mappedRecord
    );

    await writeIndex(store, indexedData, indexedDataKey);
};
