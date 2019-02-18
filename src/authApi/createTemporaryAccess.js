import {tempCodeExpiryLength} from "./authCommon";
import {generate} from "shortid";

export const createTemporaryAccess = app => userName =>  {

}

export const getTemporaryCode = async app => {
    const tempCode = 
        generate() + 
        generate() + 
        generate() + 
        generate();

    const tempId = generate();

    return {
        temporaryAccessHash: await app.crypto.hash(
            tempCode,
        ),
        temporaryAccessExpiryEpoch: 
            (await app.getEpochTime()) + tempCodeExpiryLength,
        tempCode: `${tempId}:${tempCode}`,
        temporaryAccessId: tempId
    };
};

