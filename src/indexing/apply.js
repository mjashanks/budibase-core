import Papa from "papaparse";
import {find, pull, merge, isString} from "lodash";
import {readIndex, getIndexedDataKey, getIndexedDataKey_fromViewKey} from "./read";
// refactor write and read
export const writeIndex = async (datastore, indexedData, 
                                viewNodeOrViewKey, decendantKey) => {
    const indexContents = Papa.unparse(indexedData);

    const indexedDataKey = 
        isString(viewNodeOrViewKey)
        ? getIndexedDataKey_fromViewKey(viewNodeOrViewKey)
        : getIndexedDataKey(decendantKey, viewNodeOrViewKey);

    await datastore.updateFile(
            indexedDataKey, 
            indexContents);
};

const compareKey = mappedRecord => i => i.key === mappedRecord.key; 


export const add = async (store, viewNode, mappedRecord) => {
    const indexedDataKey = getIndexedDataKey(mappedRecord.key, viewNode);
    const indexedData = await readIndex(store, indexedDataKey);
    indexedData.push(mappedRecord);
    await writeIndex(store, indexedData, viewNode, mappedRecord.key);
};

export const remove = async (store, viewNode, mappedRecord)  => {
    const indexedDataKey = getIndexedDataKey(mappedRecord.key, viewNode);
    const indexedData = await readIndex(store, indexedDataKey);
    // using pull to mutate on purpose, so we dont have a copy of the array
    // (which may be large)
    pull(indexedData, 
         find(indexedData, compareKey(mappedRecord))
    );

    await writeIndex(store, indexedData, viewNode, mappedRecord.key);
};

export const update = async (store, viewNode, mappedRecord) => {
    const indexedDataKey = getIndexedDataKey(mappedRecord.key, viewNode);
    const indexedData = await readIndex(store, indexedDataKey);

    merge(
        find(indexedData, compareKey(mappedRecord)),
        mappedRecord
    );

    await writeIndex(store, indexedData, viewNode, mappedRecord.key);
};
