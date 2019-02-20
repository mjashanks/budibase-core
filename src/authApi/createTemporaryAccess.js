import {tempCodeExpiryLength} from "./authCommon";
import {generate} from "shortid";
import {split} from "lodash/fp";
import {$} from "../common";

export const createTemporaryAccess = app => async userName =>  {

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
        tempCode: `tmp:${tempId}:${tempCode}`,
        temporaryAccessId: tempId
    };
};

export const looksLikeTemporaryCode = code =>
    code.startsWith("tmp:");

export const parseTemporaryCode = fullCode => 
    $(fullCode, [
        split(":"),
        parts => ({
            id:parts[0],
            code:parts[1]
        })
    ]);