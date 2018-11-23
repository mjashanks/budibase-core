import Papa from "papaparse";
import {find, pull, merge, isString} from "lodash";
import {readIndex, getIndexedDataKey, getIndexedDataKey_fromIndexKey} from "./read";
// refactor write and read
export const writeIndex = async (datastore, indexedData, 
                                indexKey) => {
    const indexContents = Papa.unparse(indexedData);

    const indexedDataKey = getIndexedDataKey_fromIndexKey(indexKey);

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


export const add = async (store, mappedRecord, indexKey) => {
    const indexedDataKey = getIndexedDataKey_fromIndexKey(indexKey);
    const indexedData = await readIndex(store, indexedDataKey);
    indexedData.push(mappedRecord);
    await writeIndex(store, indexedData, indexedDataKey);
};

export const remove = async (store, mappedRecord, indexKey)  => {
    const indexedDataKey = getIndexedDataKey_fromIndexKey(indexKey);
    const indexedData = await readIndex(store, indexedDataKey);
    // using pull to mutate on purpose, so we dont have a copy of the array
    // (which may be large)
    pull(indexedData, 
         find(indexedData, compareKey(mappedRecord))
    );

    await writeIndex(store, indexedData, indexedDataKey);
};

export const update = async (store, mappedRecord, indexKey) => {
    const indexedDataKey = getIndexedDataKey_fromIndexKey(indexKey);
    const indexedData = await readIndex(store, indexedDataKey);

    merge(
        find(indexedData, compareKey(mappedRecord)),
        mappedRecord
    );

    await writeIndex(store, indexedData, indexedDataKey);
};
