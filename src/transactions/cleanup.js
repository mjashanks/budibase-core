import {retrieve} from "./retrieve";

//const indexedDataKey = getIndexedDataKey(indexNode, indexKey, mappedRecord);

export const cleanup = async app => {

    const transactions = await retrieve(app);

    
}