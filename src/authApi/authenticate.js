import {getUsers} from "./getUsers";
import {find, filter, some, map} from "lodash/fp";
import {getUserByName, userAuthFile} from "./authCommon";
import {parseTemporaryCode} from "./createTemporaryAccess";
import {loadAccessLevels} from "./loadAccessLevels";
import {temporaryAccessPermissions} from "./getNewAccessLevel";
import { isNothing, $ } from "../common";

export const authenticate = app => async (username, password) => {

    if(isNothing(username) || isNothing(password))
        return null;

    let user = getUserByName(
                    await getUsers(app),
                    username
                );
             
    const notAUser = "not-a-user";
    // continue with non-user - so time to verify remains consistent
    // with verification of a valid user
    if(!user || !user.enabled) 
        user = notAUser; 

    let userAuth;
    try {
        userAuth = app.datastore.loadJson(
            userAuthFile(username)
        );
    } catch(_) {
        userAuth = {accessLevels:[], passwordHash:"not a hash"};
    }

    const permissions = await buildUserPermissions(app, userAuth.accessLevels);

    const verified = await app.crypto.verify(
        userAuth.passwordHash, 
        password);

    if(user === notAUser)
        return null;

    return verified
           ? {...user, permissions, temp:false}
           : null;
};

export const authenticateTemporaryAccess = app => async (tempAccessCode) => {

    const temp = parseTemporaryCode(tempAccessCode);
    const user = $(await getUsers(app),[
        find(u => u.temporaryAccessId === temp.id)
    ]);

    if(!user || !user.enabled) return null; 

    const userAuth = await app.datastore.loadJson(
        userAuthFile(user.name)
    );

    if(userAuth.temporaryAccessExpiryEpoch < await app.getEpochTime()) 
        return null;

    const verified =  await app.crypto.verify(
        userAuth.temporaryAccessHash, 
        temp.code); 

    return verified
           ? {
               ...user, 
               permissions: 
               temporaryAccessPermissions(), temp:true
            }
           : null;
}

export const buildUserPermissions = async (app, userAccessLevels) => {
    const allAccessLevels = await loadAccessLevels(app)();

    return $(allAccessLevels, [
        filter(l => some(ua => l.name === ua)(userAccessLevels)),
        map(l => l.levels)
    ]);
};