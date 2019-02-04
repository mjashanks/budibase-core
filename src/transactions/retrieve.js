import {idSep, TRANSACTIONS_FOLDER, isUpdate,
        isCreate, getTransactionId, 
        isDelete} from "./create";
import {joinKey, tryAwaitOrIgnore, $, none} from "../common";
import {generate} from "shortid";
import {map, filter, groupBy, split,
    some, find} from "lodash/fp";
import {load} from "../recordApi/load";

const NO_LOCK = "no lock";
const isNolock = id => id === NO_LOCK;
const timeoutMilliseconds =  30 * 1000;
const maxLockRetries = 1;
const LOCK_FILENAME = "lock";
const LOCK_FILE_KEY = joinKey(
    TRANSACTIONS_FOLDER, LOCK_FILENAME);

export const lockKey = joinKey(TRANSACTIONS_FOLDER, LOCK_FILENAME);

export const retrieve = async app => {
    const lockid = await getLock(app.datastore);

    if(isNolock(lockid)) return [];

    const transactionFiles = await app.datastore.getFolderContents(
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

    const verify = async t => {
        
        if(t.verified === true) return t;
        
        const id = getTransactionId(
            t.recordId,
            t.transactionType,
            t.uniqueId);
        
        const transaction = await app.datastore.loadJson(
            joinKey(TRANSACTIONS_FOLDER, id)
        );

        if(isDelete(t)) {
            t.record = transaction.record;
            t.verified = true;
            return t;
        }
        
        const rec = await load(app)(
            transaction.recordKey
        );
        if(rec.transactionId === id) {
            t.record = rec;
            if(!!transaction.oldRecord) 
                t.oldRecord = transaction.oldRecord;
            t.verified = true;
        } else {
            t.verified = false;
        }

        return t;
    }

    const pickOne = async (trans, forType) => {
        if(filter(forType)(trans).length === 1) {
            const t = await verify(trans[0]);
            return (t.verified === true ? t : null);
        } else {
            for(let t of filter(forType)(trans)) {
                t = await verify(t);
                if(t.verified === true)
                    return t;
            }
        }
        return null;
    };

    for(let recordId in transactionIdsByRecord) {
        const transIdsForRecord = transactionIdsByRecord[recordId];
        if(transIdsForRecord.length === 1) {
            const t = await verify(transIdsForRecord[0]);
            dedupedTransactions.push(t);
            continue;
        }
        if(some(isDelete)(transIdsForRecord)) {
            const t = await verify(find(isDelete)(transIdsForRecord));
            dedupedTransactions.push(t);
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