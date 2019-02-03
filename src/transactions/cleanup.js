import {retrieve, lockKey} from "./retrieve";
import {executeTransactions} from "../indexing";
import {getTransactionId, TRANSACTIONS_FOLDER} from "./create";
import {map} from "lodash/fp";
import {$, joinKey} from "../common";
//const indexedDataKey = getIndexedDataKey(indexNode, indexKey, mappedRecord);

export const cleanup = async app => {

    try {
        const transactions = await retrieve(app);
        await executeTransactions(app)(transactions);
        
        const deleteFiles = $(transactions, [
            map(t => joinKey(
                TRANSACTIONS_FOLDER,
                getTransactionId(
                t.recordId, t.transactionType,
                t.uniqueId)
            )),
            map(app.datastore.deleteFile)
        ]);

        await Promise.all(deleteFiles);
    }
    finally {
        await app.datastore.deleteFile(lockKey);
    }
    
}