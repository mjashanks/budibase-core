import {getLock, releaseLock, isNolock} from "../common";
import {ACCESS_LEVELS_LOCK_FILE, 
    ACCESS_LEVELS_FILE} from "./authCommon";

export const saveAccessLevels = app => async accessLevels => {
    const lock = await getLock(
        app, ACCESS_LEVELS_LOCK_FILE, 2000, 2);

    if(isNolock(lock))
        throw new Error("Could not get lock to save access levels");

    try{
        const existing = app.datastore.loadJson(ACCESS_LEVELS_FILE);
        if(existing.version !== accessLevels.version)
            throw new Error("Access levels have already been updated, since you loaded");
        
        accessLevels.version++;

        app.datastore.updateJson(ACCESS_LEVELS_FILE, accessLevels);
    }
    finally {
        await releaseLock(app, lock);
    }        
}