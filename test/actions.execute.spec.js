import {createAppDefinitionWithActionsAndTriggers} from "./specHelpers";
import {getAppApis} from "../src";

describe("actions execute", () => {

    it("should successfully execute actions", async () => {
        const {emails, 
            templateApi, behaviourSources} = await createAppDefinitionWithActionsAndTriggers();

        const apis = await getAppApis(
            templateApi._storeHandle, behaviourSources);

        apis.actions.sendEmail("an email");
        expect(emails).toEqual(["an email"]);
    });

});