import {getAppApis} from "../src";
import {getMemoryTemplateApi, 
    basicAppHeirarchyCreator_WithFields,
    createValidActionsAndTriggers} from "./specHelpers";
import {createBehaviourSources} from "../src/actions/buildBehaviourSource";

describe("getAppApis", () => {

    const getMemoryAppApis = async () => {
        const templateApi = getMemoryTemplateApi();
        const rootNode = templateApi.getNewRootLevel();
        await templateApi.saveApplicationHeirarchy(rootNode);

        return await getAppApis(templateApi._storeHandle);
    }

    it("should return api factory functions", async () => {
        const apis = await getMemoryAppApis();
        expect(apis.recordApi).toBeDefined();
        expect(apis.templateApi).toBeDefined();
        expect(apis.collectionApi).toBeDefined();
        expect(apis.viewApi).toBeDefined();
        expect(apis.subscribe).toBeDefined();
    });

});


describe("getAppApis > initialiseActions", () => {

    const createAppDefinition = async () => {
        const templateApi = getMemoryTemplateApi();
        const {root} = basicAppHeirarchyCreator_WithFields(templateApi);
        await templateApi.saveApplicationHeirarchy(root);
        
        const actionsAndTriggers = createValidActionsAndTriggers();
        const {allActions, allTriggers} = actionsAndTriggers;
        await templateApi.saveActionsAndTriggers(allActions, allTriggers);

        return {templateApi, ...actionsAndTriggers};
    }

    it("should expose actions when all sources and behvaviours are present", async () => {
        const {logs, emails, 
            call_timers, behaviourSources,
            templateApi} = await createAppDefinition();
        const {actions} = await getAppApis(
            templateApi._storeHandle, behaviourSources);

        actions.sendEmail("email");
        actions.measureCallTime("calltime");
        actions.logMessage("message");

        expect(logs.length).toBe(1);
        expect(logs[0]).toBe("message");

        expect(emails.length).toBe(1);
        expect(emails[0]).toBe("email");

        expect(call_timers.length).toBe(1);
        expect(call_timers[0]).toBe("calltime");

    });

    it("should throw exception when behaviour source is missing", async () => {
        const {behaviourSources} = await createAppDefinition();
        delete behaviourSources["my-custom-lib"];
        
        let ex;

        try {
            await getAppApis(
                templateApi._storeHandle, behaviourSources);
        }
        catch (e) {
            ex = e;
        }

        expect(ex).toBeDefined();
        
    });

    it("should throw exception when behaviour is missing", async () => {
        const {behaviourSources} = await createAppDefinition();
        delete behaviourSources["my-custom-lib"]["send_email"];
        
        let ex;

        try {
            await getAppApis(
                templateApi._storeHandle, behaviourSources);
        }
        catch (e) {
            ex = e;
        }

        expect(ex).toBeDefined();
        
    });

});