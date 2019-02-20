import {userAuthFile} from "./authCommon";
import {parseTemporaryCode, 
    looksLikeTemporaryCode} from "./createTemporaryAccess";
import {isSomething} from "../common";

export const isValidPassword = app => async password => {
    return true;
};

export const setMyPassword = app => async (oldpassword_orTempAccess, newpassword) => 
    setPassword(app)(oldpassword_orTempAccess, newpassword);

export const setPassword = app => async (username, pw_orTempCode, newpassword) => {
    const existingAuth = await app.datastore.loadJson(
        userAuthFile(username)
    );

    const doSet = async () => {
        existingAuth.temporaryAccessHash = "";
        existingAuth.temporaryAccessExpiryEpoch = 0;
        existingAuth.passwordHash = await app.crypto.hash(
            newpassword
        );
        await app.datastore.updateJson(
            userAuthFile(username)
        );
    };

    const currentTime = await app.getEpochTime();

    if(isSomething(existingAuth.temporaryAccessHash)
       || existingAuth.temporaryAccessExpiryEpoch > currentTime) {

        const verified = await app.crypto.verify(
            existingAuth.temporaryAccessHash, 
            pw_orTempCode);

        if(verified) {
            await doSet();
            return true;
        }
    }
    
    if(isSomething(existingAuth.passwordHash)) {
        
        const verified = await app.crypto.verify(
            existingAuth.passwordHash, 
            pw_orTempCode);

        if(verified) {
            await doSet();
            return true;
        }
    }

    return false;

};

