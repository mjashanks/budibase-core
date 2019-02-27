import {setupAppheirarchy, 
    basicAppHeirarchyCreator_WithFields} from "./specHelpers";
import { permissionTypes, 
    userAuthFile} from "../src/authApi/authCommon";
import {addPermission} from "../src/authApi/getNewAccessLevel";


describe("authApi > changeMyPassword", () => {

    it("should be able to authenticate after a change", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "firstpassword");
        const firstPasswordCheck = await authApi.authenticate(u.name, "firstpassword");
        expect(firstPasswordCheck).not.toBeNull();
        const changeResult = await authApi.changeMyPassword("firstpassword", "secondpassword");
        expect(changeResult).toBe(true);
        const firstPasswordReCheck = await authApi.authenticate(u.name, "firstpassword");
        expect(firstPasswordReCheck).toBeNull();
        const secondPasswordCheck = await authApi.authenticate(u.name, "secondpassword");
        expect(secondPasswordCheck).not.toBeNull();
    });

    it("should not change password if current password is incorrect", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "firstpassword");
        const changeResult = await authApi.changeMyPassword("not-firstpassword", "secondpassword");
        expect(changeResult).toBe(false);
        const secondPasswordCheck = await authApi.authenticate(u.name, "secondpassword");
        expect(secondPasswordCheck).toBeNull();
    });

});


describe("authApi > resetPasswordFlow", () => {

    it("should successfully set password from temporary access", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "firstpassword");

        const tempCode = await authApi.createTemporaryAccess(u.name);

        const result = await authApi.setPasswordFromTemporaryCode(tempCode,"secondpassword");
        expect(result).toBe(true);
        const secondPasswordCheck = await authApi.authenticate(u.name, "secondpassword");
        expect(secondPasswordCheck).not.toBeNull();

    });

    it("should not set password when temporary access expired", async () => {
        const {authApi, app} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "firstpassword");

        const tempCode = await authApi.createTemporaryAccess(u.name);

        const userAuth = await app.datastore.loadJson(
            userAuthFile(u.name)
        );
        userAuth.temporaryAccessExpiryEpoch = 0;
        await app.datastore.updateJson(
            userAuthFile(u.name), userAuth
        );
        const result = await authApi.setPasswordFromTemporaryCode(tempCode,"secondpassword");
        expect(result).toBe(false);
        const secondPasswordCheck = await authApi.authenticate(u.name, "secondpassword");
        expect(secondPasswordCheck).toBeNull();

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