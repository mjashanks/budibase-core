import {retrieve, lockKey} from "./retrieve";
import {executeTransactions} from "../indexing";
import {getTransactionId} from "./create";
import {map} from "lodash/fp";
import {$} from "../common";
//const indexedDataKey = getIndexedDataKey(indexNode, indexKey, mappedRecord);

export const cleanup = async app => {

    try {
        const transactions = await retrieve(app);
        await executeTransactions(app)(transactions);
        
        const deleteFiles = $(transactions, [
            map(t => getTransactionId(
                t.recordId, t.transactionType,
                t.uniqueId
            )),
            map(app.datastore.deleteFile)
        ]);

        await Promise.all(deleteFiles);
    }
    finally {
        await app.datastore.deleteFile(lockKey);
    }
    
}