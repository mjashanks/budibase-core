import {getUsers} from "./getUsers";
import {find, filter, some, 
        map, flatten} from "lodash/fp";
import {getUserByName, userAuthFile} from "./authCommon";
import {parseTemporaryCode} from "./createTemporaryAccess";
import {loadAccessLevels} from "./loadAccessLevels";
import { isNothingOrEmpty, $ } from "../common";

const dummyHash = "$argon2i$v=19$m=4096,t=3,p=1$UZRo409UYBGjHJS3CV6Uxw$rU84qUqPeORFzKYmYY0ceBLDaPO+JWSH4PfNiKXfIKk";

export const authenticate = app => async (username, password) => {

    if(isNothingOrEmpty(username) || isNothingOrEmpty(password))
        return null;

    const allUsers = await getUsers(app)();
    let user = getUserByName(
                    allUsers,
                    username
                );
             
    const notAUser = "not-a-user";
    // continue with non-user - so time to verify remains consistent
    // with verification of a valid user
    if(!user || !user.enabled) 
        user = notAUser; 

    let userAuth;
    try {
        userAuth = await app.datastore.loadJson(
            userAuthFile(username)
        );
    } catch(_) {
        userAuth = {accessLevels:[], passwordHash:dummyHash};
    }

    const permissions = await buildUserPermissions(app, user.accessLevels);

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

    if(isNothingOrEmpty(tempAccessCode))
        return null;

    const temp = parseTemporaryCode(tempAccessCode);
    const user = $(await getUsers(app)(),[
        find(u => u.temporaryAccessId === temp.id)
    ]);

    if(!user || !user.enabled) 
        return null; 

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
               permissions: [], 
               temp:true
            }
           : null;
}

export const buildUserPermissions = async (app, userAccessLevels) => {
    const allAccessLevels = await loadAccessLevels(app)();

    return $(allAccessLevels.levels, [
        filter(l => some(ua => l.name === ua)(userAccessLevels)),
        map(l => l.permissions),
        flatten
    ]);
};