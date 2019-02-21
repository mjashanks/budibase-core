import {userAuthFile} from "./authCommon";
import {parseTemporaryCode, 
    looksLikeTemporaryCode} from "./createTemporaryAccess";
import {isSomething} from "../common";

export const isValidPassword = app => async password => {
    return scorePassword(password).score > 30;
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

export const scorePassword = (password) => {

    // from https://stackoverflow.com/questions/948172/password-strength-meter
    // thank you https://stackoverflow.com/users/46617/tm-lv

    let score = 0;
    if (!password)
        return score;

    // award every unique letter until 5 repetitions
    let letters = new Object();
    for (let i=0; i<password.length; i++) {
        letters[password[i]] = (letters[password[i]] || 0) + 1;
        score += 5.0 / letters[password[i]];
    }

    // bonus points for mixing it up
    const variations = {
        digits: /\d/.test(password),
        lower: /[a-z]/.test(password),
        upper: /[A-Z]/.test(password),
        nonWords: /\W/.test(password),
    }

    let variationCount = 0;
    for (let check in variations) {
        variationCount += (variations[check] == true) ? 1 : 0;
    }
    score += (variationCount - 1) * 10;

    const strengthText =
        score > 80 
        ? "strong"
        : score > 60
        ? "good"
        : score >= 30
        ? "weak"
        : "very weak";

    return {
        score: parseInt(score), 
        strengthText
    };
}

