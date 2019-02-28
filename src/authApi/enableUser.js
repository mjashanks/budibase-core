import {getLock, 
    isNolock, releaseLock} from "../common/lock";
import { USERS_LOCK_FILE, USERS_LIST_FILE, getUserByName } from "./authCommon";

export const enableUser = app => async username => 
    await toggleUser(app, username, true);

export const disableUser = app => async username => 
    await toggleUser(app, username, false);

const toggleUser = async (app, username, enabled) => {
    const lock = await getLock(app, USERS_LOCK_FILE, 1000, 1, 0);

    const actionName = enabled ? "enable" : "disable";

    if(isNolock(lock))
        throw new Error(`Could not ${actionName} user - cannot get lock`);

    try {
        const users = await app.datastore.loadJson(USERS_LIST_FILE);
        const user = getUserByName(users, username);
        if(!user)
            throw new Error(`Could not find user to ${actionName}`);

        if(user.enabled === !enabled) {
            user.enabled = enabled;
            await app.datastore.updateJson(USERS_LIST_FILE, users);
        }
    }
    finally {
        releaseLock(app, lock);
    }
}