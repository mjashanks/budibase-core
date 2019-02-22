import {ACCESS_LEVELS_FILE} from "./authCommon";

export const loadAccessLevels = app => async () => 
    await app.datastore.loadJson(ACCESS_LEVELS_FILE);