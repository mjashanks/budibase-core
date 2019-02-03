import {idSep, TRANSACTIONS_FOLDER, isUpdate,
        isCreate, getTransactionId, 
        isDelete} from "./create";
import {joinKey, tryAwaitOrIgnore, $, none} from "../common";
import {generate} from "shortid";
import {map, filter, groupBy, 
    some, find} from "lodash/fp";

const NO_LOCK = "no lock";
const isNolock = id => id === NO_LOCK;
const timeoutMilliseconds =  30 * 1000;
const maxLockRetries = 1;
const LOCK_FILENAME = "lock";

export const lockKey = joinKey(TRANSACTIONS_FOLDER, LOCK_FILENAME);

export const retrieve = async app => {
    const lockid = await getLock(app.datastore);

    if(isNolock(lockid)) return [];

    const transactionFiles = await datastore.getFolderContents(
        TRANSACTIONS_FOLDER
    );

    const transactionIds = $(transactionFiles, [
        filter(f => f !== LOCK_FILENAME),
        map(parseTransactionId),
    ]);

    const transactionIdsByRecord = $(transactionIds, [
        groupBy("recordId")
    ]);

    const dedupedTransactions = [];

    const pickOne = async (trans, forType) => {
        if(filter(forType)(trans).length === 1) {
            return find(forType)(trans)
        } else {
            for(let t of filter(forType)(trans)) {
                const id = getTransactionId(
                    t.recordId,
                    t.transactionType,
                    t.uniqueId);
                const transaction = await app.datastore.loadJson(id);
                const rec = await app.datastore.loadJson(
                    transaction.newRecord.key
                );
                if(rec.transactionId === id) 
                    return t;
            }
        }
        return null;
    };

    for(let transIdsForRecord in transactionIdsByRecord) {
        if(transIdsForRecord.length === 1) {
            dedupedTransactions.push(transIdsForRecord);
            continue;
        }
        if(some(isDelete)(transIdsForRecord)) {
            dedupedTransactions.push(
                find(isDelete)(transIdsForRecord)
            );
            continue;
        }
        if(some(isUpdate)(transIdsForRecord)) {
            const upd = await pickOne(transIdsForRecord, isUpdate);
            if(isSomething(upd))
                dedupedTransactions.push(upd);
            continue;
        }
        if(some(isCreate)(transIdsForRecord)) {
            const cre = await pickOne(transIdsForRecord, isCreate);
            if(isSomething(cre))
                dedupedTransactions.push(cre);
            continue;
        }
    }

    const duplicates = $(transactionIds, [
        filter(t => none(ddt => ddt.uniqueId === t.uniqueId)
                    (dedupedTransactions))
    ]);

    
    const deletePromises = 
        map(t => app.datastore.deleteFile(
                joinKey(
                    TRANSACTIONS_FOLDER,
                    getTransactionId(
                        t.recordId,
                        t.transactionType,
                        t.uniqueId)
                )
            )
        )(duplicates);

    await Promise.all(deletePromises);
    
    return dedupedTransactions;
};


const getLock = async (datastore, retryCount=0) => {
    const id = generate()
    try {
        await datastore.createFile(lockKey, id);
        return id;
    } catch(e) {

        return NO_LOCK;
        // below is about checking lock for timeout
        const lastModified = await datastore.getLastModifiedTime(lockKey);
        const currentTime = await datastore.getCurrentTime();

        if(currentTime - lastModified > timeoutMilliseconds) {
            tryAwaitOrIgnore(datastore.deleteFile, lockKey);
        } 

        if(retryCount < maxLockRetries ) {
            return await getLock(datastore, retryCount++);
        }
    }

    return NO_LOCK;
};

const parseTransactionId = id => {
    const splitId = split(idSep)(id);
    return ({
        recordId: splitId[0],
        transactionType: splitId[1],
        uniqueId: splitId[2],
    });
};