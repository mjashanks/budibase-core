import {getUsers} from "./getUsers";
import {find} from "lodash/fp";
import {getUserByName, userAuthFile} from "./authCommon";
import {parseTemporaryCode} from "./createTemporaryAccess";

export const authenticate = app => async (username, password) => {
    const user = getUserByName(
                    await getUsers(app),
                    username
                );
                
    if(!user || !user.enabled) return null; 

    const verified = await app.crypto.verify(
        user.passwordSaltedHash, 
        password);  

    return verified
           ? {...user, temp:false}
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
           ? {...user, temp:true}
           : null;
}