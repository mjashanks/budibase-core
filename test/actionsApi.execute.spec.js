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

describe("triggers execute", () => {

    it("should run action when no condition is set", async () => {
        const {logs, 
            templateApi, behaviourSources} = await createAppDefinitionWithActionsAndTriggers();

        const {recordApi, asFullAccess} = await getAppApis(
            templateApi._storeHandle, behaviourSources);
        asFullAccess();
        // trigger setup to add to logs on recordApi:save:onError event
        const customer = recordApi.getNew("/customers", "customer");

        let errCaught;
        try {
            await recordApi.save(customer);
        } catch (e) {
            errCaught = e.message;
        }

        expect(logs).toEqual([errCaught]);

    });

    it("should run action when condition is met", async () => {
        const {call_timers, 
               templateApi, 
               behaviourSources} = await createAppDefinitionWithActionsAndTriggers();

        const {recordApi, asFullAccess} = await getAppApis(
            templateApi._storeHandle, behaviourSources);
        asFullAccess();

        const customer = recordApi.getNew("/customers", "customer");
        customer.surname = "Ledog";

        // trigger call_timer set to return 999 all the time, just for test
        // trigger set to run for type = customer
        await recordApi.save(customer);
        
        expect(call_timers).toEqual([999]);
    });

    it("should not run action when condition is not met", async () => {
        const {call_timers, 
               templateApi, 
               behaviourSources} = await createAppDefinitionWithActionsAndTriggers();

        const {recordApi, asFullAccess} = await getAppApis(
            templateApi._storeHandle, behaviourSources);
        asFullAccess();

        const partner = recordApi.getNew("/partners", "partner");

        // trigger call_timer set to return 999 all the time, just for test
        // trigger set to run for type = customer
        await recordApi.save(partner);
        
        expect(call_timers).toEqual([]);
    });

});