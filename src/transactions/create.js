import {generate} from "shortid";
import {joinKey} from "../common";
import {getLastPartInKey} from "../templateApi/heirarchy";
import {split} from "lodash/fp";


export const CREATE_RECORD_TRANSACTION = "create";
export const UPDATE_RECORD_TRANSACTION = "update";
export const DELETE_RECORD_TRANSACTION = "delete";

export const transactionForCreateRecord = async (app, record) => 
    await transaction(app.datastore, CREATE_RECORD_TRANSACTION, {record});

export const transactionForUpdateRecord = async (app, oldRecord, newRecord) => 
    await transaction(app.datastore, UPDATE_RECORD_TRANSACTION, {oldRecord, newRecord});

export const transactionForDeleteRecord = async (app, record) => 
    await transaction(app.datastore, DELETE_RECORD_TRANSACTION, {record});

export const idSep = "$";
export const TRANSACTIONS_FOLDER = ".transactions"
export const getTransactionId = (recordId, transactionType, uniqueId) => 
    `${recordId}${idSep}${transactionType}${idSep}${uniqueId}`

export const isUpdate = isOfType(UPDATE_RECORD_TRANSACTION);
export const isDelete = isOfType(DELETE_RECORD_TRANSACTION);
export const isCreate = isOfType(CREATE_RECORD_TRANSACTION);

const transaction = async (datastore, transactionType, data) => {

    const recordId = transactionType === CREATE_RECORD_TRANSACTION
                     ? data.record.id
                     : transactionType === UPDATE_RECORD_TRANSACTION
                     ? data.newRecord.id
                     : transactionType === DELETE_RECORD_TRANSACTION 
                     ? getLastPartInKey(data.key) 
                     : "really this should not happen";

    
    const id = getTransactionId(
        recordId, transactionType,generate()
    );

    const key = joinKey(TRANSACTIONS_FOLDER, id);

    const trans = {
        transactionType,
        ...data,
        id
    };

    await datastore.createJson(
        key, trans
    );

    return trans;
}
