import {setupAppheirarchy, validUser,
    basicAppHeirarchyCreator_WithFields} from "./specHelpers";
import { parseTemporaryCode,
    USERS_LOCK_FILE,
    USERS_LIST_FILE,
    getUserByName} from "../src/authApi/authCommon";
import {addPermission} from "../src/authApi/getNewAccessLevel";
import {$} from "../src/common";
import {getLock} from "../src/common/lock";


describe("authApi > enableUser", () => {

    it("should enable a user when disabled", async () => {
        const {authApi, app} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "firstpassword", false);
        await authApi.enableUser(u.name);
        const loadedUser = await getUser(app, authApi, u.name);
        expect(loadedUser.enabled).toBe(true);

    });

    it("should do nothing when user already enabled", async () => {
        const {authApi, app} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "firstpassword", true);
        await authApi.enableUser(u.name);
        const loadedUser = await getUser(app, authApi, u.name);
        expect(loadedUser.enabled).toBe(true);
    });

    it("should throw en error when user does not exist", async () => {
        const {authApi, app} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "firstpassword", false);
        let ex;
        try {
            await authApi.enableUser("nobody");
        } catch(e) {
            ex = e;
        }
        expect(ex).toBeDefined();
    });

    it("should throw en error when users file is locked", async () => {
        const {authApi, app} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "firstpassword", false);
        await getLock(app, USERS_LOCK_FILE, 10000, 0, 0);
        let ex;
        try {
            await authApi.enableUser(u.name);
        } catch(e) {
            ex = e;
        }
        expect(ex).toBeDefined();
    });

});

describe("authApi > disableUser", () => {

    it("should disable a user when enabled", async () => {
        const {authApi, app} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "firstpassword", true);
        await authApi.disableUser(u.name);
        const loadedUser = await getUser(app, authApi, u.name);
        expect(loadedUser.enabled).toBe(false);

    });

    it("should do nothing when user already enabled", async () => {
        const {authApi, app} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "firstpassword", false);
        await authApi.disableUser(u.name);
        const loadedUser = await getUser(app, authApi, u.name);
        expect(loadedUser.enabled).toBe(false);
    });

    it("should throw en error when user does not exist", async () => {
        const {authApi, app} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "firstpassword", false);
        let ex;
        try {
            await authApi.disableUser("nobody");
        } catch(e) {
            ex = e;
        }
        expect(ex).toBeDefined();
    });

    it("should throw en error when users file is locked", async () => {
        const {authApi, app} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "firstpassword", false);
        await getLock(app, USERS_LOCK_FILE, 10000, 0, 0);
        let ex;
        try {
            await authApi.disableUser(u.name);
        } catch(e) {
            ex = e;
        }
        expect(ex).toBeDefined();
    });

});

const getUser = async (app, authApi, userName) => 
    $(await app.datastore.loadJson(USERS_LIST_FILE), [
        users => getUserByName(users, userName)
    ]);