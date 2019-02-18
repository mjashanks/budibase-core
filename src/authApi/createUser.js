import {validateUser} from "./validateUser";
import {join, some} from "lodash/fp";
import {getLock, isNolock, releaseLock} from "../common";
import {USERS_LOCK_FILE, USERS_LIST_FILE} from "./authCommon";

export const createUser = app => async user => {

    const userErrors = await validateUser(user);
    if(userErrors.length > 0)
        throw new Error("User is invalid. " + join("; ")(userErrors));

    const lock = await getLock(
        app, USERS_LOCK_FILE, 1000, 2
    );

    if(isNolock(lock))
        throw new Error("Unable to create user, could not get lock - try again");
    
    const users = await app.datastore.loadJson(USERS_LIST_FILE);
    
    if(some(u => u.name === user.name)(users))
        throw new Error("User already exists");

    users.push(user);
    await app.datastore.saveJson(USERS_LIST_FILE, users);

    await releaseLock(app, lock);
};