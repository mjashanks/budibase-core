import {getTemporaryCode} from "./createTemporaryAccess";

export const getNewUser = async app => {
    const tempAccess = await getTemporaryCode(app);
    return {
        user : {
            name: "",
            accessLevels: [],
            passwordHash: "",
            temporaryAccessHash: tempAccess.temporaryAccessHash,
            temporaryAccessExpiryEpoch: tempAccess.temporaryAccessExpiryEpoch,
            temporaryAccessId: tempAccess.temporaryAccessId
        },
        temporaryCode = tempAccess.tempCode
    }
};