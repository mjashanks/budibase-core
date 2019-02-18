import {validateUser} from "./validateUser";
import {join, some, clone} from "lodash/fp";
import {getLock, isNolock, isSomething,releaseLock} from "../common";
import {USERS_LOCK_FILE, USERS_LIST_FILE} from "./authCommon";
import {getTemporaryCode} from "./createTemporaryAccess";
import {isValidPassword} from "./setPassword";

export const createUser = app => async (user, password=null) => {

    const userErrors = await validateUser(user);
    if(userErrors.length > 0)
        throw new Error("User is invalid. " + join("; ")(userErrors));

    applyAccess(app, user, password);
    const {forSave, forReturn} = splitForSaveAndReturn(user);

    const lock = await getLock(
        app, USERS_LOCK_FILE, 1000, 2
    );

    if(isNolock(lock))
        throw new Error("Unable to create user, could not get lock - try again");
    
    const users = await app.datastore.loadJson(USERS_LIST_FILE);
    
    if(some(u => u.name === user.name)(users))
        throw new Error("User already exists");

    users.push(forSave);
    await app.datastore.saveJson(USERS_LIST_FILE, users);

    await releaseLock(app, lock);
    
    return forReturn;
};

const applyAccess = async (app, user, password) => {

    if(isSomething(password)) {
        if(isValidPassword(password)) {
            user.passwordHash = await app.crypto.hash(password);
            user.temporaryAccessHash = "";
            user.temporaryAccessId = "";
            user.temporaryAccessExpiryEpoch = 0;
            user.tempCode = "";
        } else {
            throw new Error("Password does not meet requirements");
        }
    } else {
        const tempAccess = await getTemporaryCode(app);
        user.temporaryAccessHash = tempAccess.temporaryAccessHash;
        user.temporaryAccessId = tempAccess.temporaryAccessId;
        user.temporaryAccessExpiryEpoch = tempAccess.temporaryAccessExpiryEpoch;
        user.tempCode = tempAccess.tempCode;
        user.passwordHash = "";
    }
    return user;
}

const splitForSaveAndReturn = user => {
    const forSave = clone(user);
    delete forSave.tempCode;

    const forReturn = clone(user);
    delete forReturn.temporaryAccessHash
    delete forReturn.temporaryAccessId
    delete forReturn.passwordHash

    return ({forReturn, forSave});
}