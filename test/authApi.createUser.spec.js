import {setupAppheirarchy, 
    basicAppHeirarchyCreator_WithFields} from "./specHelpers";
import { WHITELIST, permissionTypes, 
    ACCESS_LEVELS_FILE, 
    ACCESS_LEVELS_LOCK_FILE} from "../src/authApi/authCommon";
import {writeTemplatesPermission} from "../src/authApi/getNewAccessLevel";
import {cloneDeep} from "lodash/fp";
import {getLock} from "../src/common/lock";
import {getNewUserAuth} from "../src/authApi/getNewUser";

describe("getNewUser", () => {
    it("should create correct fields", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const user = authApi.getNewUser();
        expect(user.name).toBe("");
        expect(user.accessLevels).toEqual([]);
        expect(user.enabled).toBe(true);
        expect(user.temporaryAccessId).toBe("");
    });
})

describe("getNewUser", () => {
    it("should create correct fields", () => {
        const userAuth = getNewUserAuth()();
        expect(userAuth.passwordHash).toBe("");
        expect(userAuth.temporaryAccessHash).toEqual("");
        expect(userAuth.temporaryAccessExpiryEpoch).toBe(0);
    });
});

describe.skip("validateUser", () => {

});

describe.skip("createUser", () => {



});