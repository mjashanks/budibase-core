import {getTemporaryCode} from "./createTemporaryAccess";

export const getNewUser = async app => ({
    name: "",
    accessLevels: [],
    passwordHash: "",
    passwordSalt: "",
    ...(await getTemporaryCode(app))
});