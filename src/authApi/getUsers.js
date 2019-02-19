import {USERS_LIST_FILE, 
    stripUserOfSensitiveStuff} from "./authCommon";
import {$} from "../common";
import {map} from "lodash/fp";

export const getUsers = app => async () => 
    $(await app.datastore.loadJson(USERS_LIST_FILE), [
        map(stripUserOfSensitiveStuff)
    ]);
