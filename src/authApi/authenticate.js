import {getUsers} from "./getUsers";
import {find} from "lodash/fp";

export const authenticate = app => (username, password) => {
    const user = $(await getUsers(app),[
        find(u => u.name === username)
    ]);

    return await app.crypto.verify(
        user.passwordSaltedHash, 
        password);  
};

export const authenticateTemporaryAccess = app => async (tempAccessCode) => {

    const parts = tempAccessCode.split(":");
    const user = $(await getUsers(app),[
        find(u => u.temporaryAccessId === parts[0])
    ]);

    if(user.temporaryAccessExpiryEpoch < await app.getEpochTime()) 
        return false;

    return await app.crypto.verify(
        user.temporaryAccessHash, 
        parts[1]); 
}