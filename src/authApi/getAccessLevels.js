import {ACCESS_LEVELS_FILE} from "./authCommon";

export const getAccessLevels = app => () => 
    await app.datastore.loadJson(ACCESS_LEVELS_FILE);