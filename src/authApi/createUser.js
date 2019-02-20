import {validateUser} from "./validateUser";
import {getNewAuth} from "./getNewUser";
import {join, some, clone} from "lodash/fp";
import {getLock, isNolock, isSomething,releaseLock} from "../common";
import {USERS_LOCK_FILE, stripUserOfSensitiveStuff,
    USERS_LIST_FILE, userAuthFile} from "./authCommon";
import {getTemporaryCode} from "./createTemporaryAccess";
import {isValidPassword} from "./setPassword";

export const createUser = app => async (user, password=null) => {

    const userErrors = await validateUser(user);
    if(userErrors.length > 0)
        throw new Error("User is invalid. " + join("; ")(userErrors));

    const {auth, tempCode} = getAccess(app, password);
    user.tempCode = tempCode;

    const lock = await getLock(
        app, USERS_LOCK_FILE, 1000, 2
    );

    if(isNolock(lock))
        throw new Error("Unable to create user, could not get lock - try again");
    
    const users = await app.datastore.loadJson(USERS_LIST_FILE);
    
    if(some(u => u.name === user.name)(users))
        throw new Error("User already exists");

    users.push(user);
    await app.datastore.updateJson(USERS_LIST_FILE, users);
    
    try {
        await app.datastore.createJson(
            userAuthFile(user.name),
            auth
        );
    } catch {
        await app.datastore.updateJson(
            userAuthFile(user.name),
            auth
        );
    }

    await releaseLock(app, lock);

    return forReturn;
};

const getAccess = async (app, password) => {

    const auth = getNewAuth();

    if(isSomething(password)) {
        if(isValidPassword(password)) {
            auth.passwordHash = await app.crypto.hash(password);
            auth.temporaryAccessHash = "";
            auth.temporaryAccessId = "";
            auth.temporaryAccessExpiryEpoch = 0;
            return {auth};
        } else {
            throw new Error("Password does not meet requirements");
        }
    } else {
        const tempAccess = await getTemporaryCode(app);
        auth.temporaryAccessHash = tempAccess.temporaryAccessHash;
        auth.temporaryAccessExpiryEpoch = tempAccess.temporaryAccessExpiryEpoch;
        auth.passwordHash = "";
        return ({
            auth, 
            tempCode: tempAccess.tempCode, 
            temporaryAccessId:tempAccess.temporaryAccessId
        });
    }
}
