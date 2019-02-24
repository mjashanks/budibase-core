import {setupAppheirarchy, 
    basicAppHeirarchyCreator_WithFields} from "./specHelpers";
import { WHITELIST, permissionTypes, 
    ACCESS_LEVELS_FILE, 
    userAuthFile,
    USERS_LOCK_FILE} from "../src/authApi/authCommon";
import {writeTemplatesPermission} from "../src/authApi/getNewAccessLevel";
import {cloneDeep} from "lodash/fp";
import {getLock} from "../src/common/lock";
import {getNewUserAuth} from "../src/authApi/getNewUser";


describe("authenticate", () => {

    it("should return true when correct password supplied", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const u = await validUser(authApi, "password");
        const result = await authApi.authenticate(u.name, "password");
        expect(result).not.toBeNull();
    });

});

const validUser = async (authApi, password) => {
    const u = authApi.getNewUser();
    u.name = "bob";
    u.accessLevels = ["admin"];
    u.enabled = true;
    
    await authApi.createUser(u, password);
    return u;
};