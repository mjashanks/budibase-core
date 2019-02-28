import {setupAppheirarchy, validUser,
    basicAppHeirarchyCreator_WithFields} from "./specHelpers";
import { parseTemporaryCode,
    userAuthFile,
    USERS_LIST_FILE,
    getUserByName} from "../src/authApi/authCommon";


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

    it("should still be able to authenticate with password when temp access is set", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "firstpassword");

        await authApi.createTemporaryAccess(u.name);

        const secondPasswordCheck = await authApi.authenticate(u.name, "firstpassword");
        expect(secondPasswordCheck).not.toBeNull();

    });
});

describe("authApi > createTemporaryAccess", () => {

    it("should set users accessId annd userAuth hash and expiry", async () => {

        const {authApi, app} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "firstpassword");

        const tempCode = await authApi.createTemporaryAccess(u.name);
        const tempInfo = parseTemporaryCode(tempCode);

        const userAuth = await app.datastore.loadJson(
            userAuthFile(u.name)
        );

        const currentTime = await app.getEpochTime();
        expect(app.crypto.verify(userAuth.temporaryAccessHash, tempInfo.code)).toBeTruthy();
        expect(userAuth.temporaryAccessExpiryEpoch).toBeGreaterThan(currentTime);

        const users = await app.datastore.loadJson(USERS_LIST_FILE);
        const user = getUserByName(users, u.name);

        expect(user.temporaryAccessId).toBe(tempInfo.id);

    });

});
