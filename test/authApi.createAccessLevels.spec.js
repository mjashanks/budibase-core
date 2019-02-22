import {setupAppheirarchy, 
    basicAppHeirarchyCreator_WithFields} from "./specHelpers";
import { WHITELIST } from "../src/authApi/authCommon";
import {writeTemplatesPermission} from "../src/authApi/getNewAccessLevel";

describe("getNewAccessLevel", () => {

    it("should create item with correct properties", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const accLev = authApi.getNewAccessLevel();
        expect(accLev.name).toBe("");
        expect(accLev.accessType).toBe(WHITELIST);
        expect(accLev.permissions).toEqual([]);
    });

});

describe("validateAccessLevels", () => {

    const validAccessLevel = (authApi) => {
        const lev = authApi.getNewAccessLevel();
        lev.name = "test level";
        writeTemplatesPermission(lev);
        return lev;        
    }

    it("should return no errors with valid access level", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const accessLevel = validAccessLevel(authApi);
        const errs = authApi.validateAccessLevels([accessLevel]);
        expect(errs).toEqual([]);
    })

    it("should error when access level name not set", async () => {
        const {authApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const accessLevel = validAccessLevel(authApi);
        accessLevel.name = "";
        const errs = authApi.validateAccessLevels([accessLevel]);
        expect(errs.length).toEqual(1);
        expect(errs[0].field).toBe("name");
    })
});