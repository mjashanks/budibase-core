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

describe("validateUsers", () => {

    const validUser = (authApi) => {
        const u = authApi.getNewUser();
        u.name = "bob";
        u.accessLevels = ["admin"];
        u.enabled = true;
        return u;
    };

    it("should not return errors for valid user", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const user = validUser(authApi);
        const errs = authApi.validateUser([user], user);
        expect(errs).toEqual([]);
    });

    it("should have error when username is not set", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const user = validUser(authApi);
        user.name = "";
        const errs = authApi.validateUser([user], user);
        expect(errs.length).toBe(1);
        expect(errs[0].field).toBe("name");
    });

    it("should have error when duplicate usernames", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const user1 = validUser(authApi);
        const user2 = validUser(authApi);
        const errs = authApi.validateUser([user1, user2], user1);
        expect(errs.length).toBe(1);
        expect(errs[0].field).toBe("name");
    });

    it("should have error when no access levels", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const user = validUser(authApi);
        user.accessLevels = [];
        const errs = authApi.validateUser([user], user);
        expect(errs.length).toBe(1);
        expect(errs[0].field).toBe("accessLevels");
    });
    
});

describe.skip("createUser", () => {



});