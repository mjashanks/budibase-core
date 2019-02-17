import {tempCodeExpiryLength} from "./authCommon";
import {generate} from "shortid";

export const createTemporaryAccess = app => userName =>  {

}

export const getTemporaryCode = async app => {
    const tempcode = 
        generate() + 
        generate() + 
        generate() + 
        generate();

    return {
        temporaryAccessHash: await app.crypto.hash(
            tempcode,
            app.crypto.randomBytes()
        ),
        temporaryAccessExpiryEpoch: 
            (await app.getEpochTime()) + tempCodeExpiryLength
    };
};

