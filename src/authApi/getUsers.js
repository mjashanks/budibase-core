 import {USERS_LIST_FILE} from "./authCommon";

export const getUsers = app => () =>
    await app.datastore.loadJson(USERS_LIST_FILE);