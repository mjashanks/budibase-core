import {ACCESS_LEVELS_FILE} from "./authCommon";
import {apiWrapper, events} from "../common";

export const loadAccessLevels = app => async () => 
    apiWrapper(
        app,
        events.authApi.loadAccessLevels, 
        {},
        _loadAccessLevels, app);

export const _loadAccessLevels = async app  => 
    await app.datastore.loadJson(ACCESS_LEVELS_FILE);