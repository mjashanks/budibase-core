import {generate} from "shortid";
import {joinKey, keySep, getHashCode,
    splitKey} from "../common";
import {getLastPartInKey} from "../templateApi/heirarchy";

const isOfType = typ => trans => 
    trans.transactionType === typ;

export const CREATE_RECORD_TRANSACTION = "create";
export const UPDATE_RECORD_TRANSACTION = "update";
export const DELETE_RECORD_TRANSACTION = "delete";
export const BUILD_INDEX_TRANSACTION = "build";
const BUILDINDEX_BATCH_COUNT = 1000;

export const transactionForCreateRecord = async (app, record) => 
    await transaction(
        app.datastore, CREATE_RECORD_TRANSACTION, 
        record.key, {record},
        getTransactionKey_Records);

export const transactionForUpdateRecord = async (app, oldRecord, newRecord) => 
    await transaction(
        app.datastore, UPDATE_RECORD_TRANSACTION, 
        newRecord.key, {oldRecord, record:newRecord},
        getTransactionKey_Records);

export const transactionForDeleteRecord = async (app, record) => 
    await transaction(
        app.datastore, DELETE_RECORD_TRANSACTION, 
        record.key, {record},
        getTransactionKey_Records);

export const transactionForBuildIndex = async (app, indexNodeKey, recordKey, count) => {
    
    const transactionFolder =  IndexNodeKeyBatchFolder(indexNodeKey, count);
    if(count % BUILDINDEX_BATCH_COUNT === 0) {
        await app.datastore.createFolder(transactionFolder);
    }

    return await transaction(
            app.datastore, BUILD_INDEX_TRANSACTION,
            recordKey, {recordKey},
            id => joinKey(transactionFolder, id));
}

export const idSep = "$";
export const TRANSACTIONS_FOLDER = keySep + ".transactions";

const buildIndexFolder = ".BUILD-";
export const nodeKeyHashFromBuildFolder = folder =>
    folder.replace(buildIndexFolder, "");
    
export const isBuildIndexFolder = key => 
    getLastPartInKey(key).startsWith(buildIndexFolder);

export const IndexNodeKeyFolder = indexNodeKey => 
    joinKey(
        TRANSACTIONS_FOLDER, 
        buildIndexFolder + keyToFolderName(indexNodeKey));

export const IndexNodeKeyBatchFolder = (indexNodeKey, count) => 
    joinKey(IndexNodeKeyFolder(indexNodeKey), Math.floor(count/BUILDINDEX_BATCH_COUNT).toString());

export const IndexShardKeyFolder = (indexNodeKey, indexShardKey) => 
    joinKey(IndexNodeKeyFolder(indexNodeKey), indexShardKey);

export const getTransactionId = (recordId, transactionType, uniqueId) => 
    `${recordId}${idSep}${transactionType}${idSep}${uniqueId}`;

export const isUpdate = isOfType(UPDATE_RECORD_TRANSACTION);
export const isDelete = isOfType(DELETE_RECORD_TRANSACTION);
export const isCreate = isOfType(CREATE_RECORD_TRANSACTION);
export const isBuildIndex = isOfType(BUILD_INDEX_TRANSACTION);

export const createBuildIndexFolder = async(datastore, indexNodeKey) =>
    await datastore.createFolder(
        IndexNodeKeyFolder(indexNodeKey));

const getTransactionKey_Records = id => joinKey(TRANSACTIONS_FOLDER, id);

export const keyToFolderName = nodeKey => getHashCode(nodeKey);

const transaction = async (datastore, transactionType, recordKey, data, getTransactionKey) => {

    /*
    const recordId = transactionType === CREATE_RECORD_TRANSACTION
                     ? data.record.id
                     : transactionType === UPDATE_RECORD_TRANSACTION
                     ? data.record.id
                     : transactionType === DELETE_RECORD_TRANSACTION 
                     ? getLastPartInKey(data.key) 
                     : "really this should not happen";
    */
    const recordId = getLastPartInKey(recordKey);
    const uniqueId = generate();
    const id = getTransactionId(
        recordId, transactionType, uniqueId
    );

    const key = getTransactionKey(id);

    const trans = {
        transactionType,
        recordKey,
        ...data,
        id
    };

    await datastore.createJson(
        key, trans
    );

    return trans;
}
