import {retrieve} from "./retrieve";
import {executeTransactions} from "./execute";
import {map} from "lodash/fp";
import {generate} from "shortid";
import {$, joinKey, tryAwaitOrIgnore} from "../common";
import {LOCK_FILE_KEY, TRANSACTIONS_FOLDER, NO_LOCK,
    timeoutMilliseconds, isNolock, parseLockFileContent, 
    getLockFileContent, getTransactionId,
    maxLockRetries} from "./transactionsCommon";

export const cleanup = async app => {

    const lockid = await getLock(app);
    if(isNolock(lockid)) return;

    try {
        const transactions = await retrieve(app);
        if(transactions.length > 0) {
            await executeTransactions(app)(transactions);
            
            const folder = transactions.folderKey 
                           ? transactions.folderKey 
                           : TRANSACTIONS_FOLDER;

            const deleteFiles = $(transactions, [
                map(t => joinKey(
                    folder,
                    getTransactionId(
                    t.recordId, t.transactionType,
                    t.uniqueId)
                )),
                map(app.datastore.deleteFile)
            ]);

            await Promise.all(deleteFiles);
        }
    }
    finally {
        await app.datastore.deleteFile(LOCK_FILE_KEY);
    }
    
}

const getLock = async (app, retryCount=0) => {
    const id = generate()
    try {
        await app.datastore.createFile(
            LOCK_FILE_KEY, 
            getLockFileContent(
                id, 
                await app.getEpochTime())
        );
        return id;
    } catch(e) {

        const currentEpochTime = await app.getEpochTime();
        const lockContent = await app.datastore.loadFile(LOCK_FILE_KEY);
        const lockInfo = parseLockFileContent(lockContent);
        const lockTimeout = (
            new Number(lockInfo.lockTime)
            +
            timeoutMilliseconds
        );

        if(currentEpochTime > lockTimeout) {
            try {
                await app.datastore.deleteFile(LOCK_FILE_KEY);
            }
            catch(_) {};
        } 

        if(retryCount < maxLockRetries ) {
            return await getLock(app, retryCount+1);
        }
    }

    return NO_LOCK;
};