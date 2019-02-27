import {setupAppheirarchy, 
    basicAppHeirarchyCreator_WithFields} from "./specHelpers";
import { permissionTypes, 
    userAuthFile} from "../src/authApi/authCommon";
import {addPermission} from "../src/authApi/getNewAccessLevel";


describe("authApi > authenticate", () => {

    it("should return user + access when correct password supplied", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "password");
        const result = await authApi.authenticate(u.name, "password");
        expect(result).not.toBeNull();
        expect(result.name).toBe("bob");
        expect(result.temp).toBe(false);
        expect(result.passwordHash).toBeUndefined();
        expect(result.temporaryAccessId).toBeUndefined();
        expect(result.permissions.length).toBe(1);
        expect(result.permissions[0]).toEqual({type:permissionTypes.SET_PASSWORD});
    });

    it("should return null when password incorrect", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "password");
        const result = await authApi.authenticate(u.name, "letmein");
        expect(result).toBeNull();
    });

    it("should return null when non existing user", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const result = await authApi.authenticate("nobody", "password");
        expect(result).toBeNull();
    });

    it("should return null when user not enabled", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "password", false);
        const result = await authApi.authenticate(u.name, "password");
        expect(result).toBeNull();
    });

    it("should return null when password not set", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "", false);
        const result = await authApi.authenticate(u.name, "");
        expect(result).toBeNull();
    });

});

describe("authApi > authenticateTemporaryAccess", () => {

    it("should return user with no permissions", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "");
        const result = await authApi.authenticateTemporaryAccess(u.tempCode);
        expect(result).not.toBeNull();
        expect(result.name).toBe("bob");
        expect(result.passwordHash).toBeUndefined();
        expect(result.permissions.length).toBe(0);
        expect(result.temp).toBe(true);
    });

    it("should return null when blank code suplied", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const result = await authApi.authenticateTemporaryAccess("");
        expect(result).toBeNull();
    });

    it("should return null when invalid code supplied", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const result = await authApi.authenticateTemporaryAccess("incorrect");
        expect(result).toBeNull();
    });

    it("should return null when user disabled", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "", false);
        const result = await authApi.authenticateTemporaryAccess(u.tempCode);
        expect(result).toBeNull();
    });

    it("should return null when temporary access code is expired", async () => {
        const {authApi, app} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "");
        const userAuth = await app.datastore.loadJson(
            userAuthFile(u.name)
        );
        userAuth.temporaryAccessExpiryEpoch = 0;
        await app.datastore.updateJson(
            userAuthFile(u.name), userAuth
        );
        const result = await authApi.authenticateTemporaryAccess(u.tempCode);
        expect(result).toBeNull();
    });
});

const validUser = async (authApi, password, enabled=true) => {
    const access = await authApi.getNewAccessLevel();
    access.name = "admin";
    addPermission.setPassword(access);

    await authApi.saveAccessLevels({version:0, levels:[access]});
    
    const u = authApi.getNewUser();
    u.name = "bob";
    u.accessLevels = ["admin"];
    u.enabled = enabled;
    
    await authApi.createUser(u, password);
    return u;
};