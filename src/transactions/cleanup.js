import {retrieve} from "./retrieve";
import {executeTransactions} from "../indexing";
//const indexedDataKey = getIndexedDataKey(indexNode, indexKey, mappedRecord);

export const cleanup = async app => {

    const transactions = await retrieve(app);
    await executeTransactions(app)(transactions);
    
}