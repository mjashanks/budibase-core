import {generate} from "shortid";
import {joinKey} from "../common";

export const CREATE_RECORD_TRANSACTION = "create";
export const UPDATE_RECORD_TRANSACTION = "update";
export const DELETE_RECORD_TRANSACTION = "delete";

export const transactionForCreateRecord = (app, record) => 
    transaction(app.datastore, CREATE_RECORD_TRANSACTION, {record});

export const transactionForUpdateRecord = (app, oldRecord, newRecord) => 
    transaction(app.datastore, UPDATE_RECORD_TRANSACTION, {oldRecord, newRecord});

export const transactionForDeleteRecord = (app, key) => 
    transaction(app.datastore, DELETE_RECORD_TRANSACTION, {key});

const transaction = async (datastore, transactionType, data) => {

    const id = `${(new Date()).getTime()}_${generate()}`;
    const key = joinKey("/.transactions", `${id}.json`);

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