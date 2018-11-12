import {getMemoryTemplateApi} from "./specHelpers";

const saveThreeLevelHeirarchy = async () => {
    const templateApi = await getMemoryTemplateApi();
    const root = templateApi.getNewRootLevel();
    const collection = templateApi.getNewCollectionTemplate(root);
    collection.name = "customers"
    const record = templateApi.getNewRecordTemplate(collection);
    record.name = "customer";
    await templateApi.saveApplicationHeirarchy(root);
    return {templateApi, root};
};

describe("Load & Save App Heirarchy", () => {

    it("should rehydrate json objects with pathRegx methods", async () => {

        const {templateApi} = await saveThreeLevelHeirarchy();
        const {heirarchy} = await templateApi.getApplicationDefinition();

        expect(heirarchy.pathRegx).toBeDefined();
        expect(heirarchy.children[0].pathRegx).toBeDefined();
        expect(heirarchy.children[0].children[0].pathRegx).toBeDefined();

    });

    it("should rehydrate json objects with parent methods", async () => {

        const {templateApi} = await saveThreeLevelHeirarchy();
        const {heirarchy} = await templateApi.getApplicationDefinition();

        expect(heirarchy.parent).toBeDefined();
        expect(heirarchy.children[0].parent).toBeDefined();
        expect(heirarchy.children[0].children[0].parent).toBeDefined();

    });

    it("should load heirarchy with exactly the same members - balls deep", async () => {

        const {templateApi, root} = await saveThreeLevelHeirarchy();
        const {heirarchy} = await templateApi.getApplicationDefinition();

        expect(JSON.stringify(heirarchy))
        .toEqual(JSON.stringify(root));
    });

    it("should throw an error when app definition does not exist", async () => {
        let ex;
        try{
            await templateApi.getApplicationDefinition()
        }
        catch(e) {
            ex = e;
        }
        expect(ex).toBeDefined();
    });

    it("should create .config folder on first save ", async () => {
        const {templateApi} = await saveThreeLevelHeirarchy();
        expect(await templateApi._storeHandle.exists("/.config")).toBeTruthy();
    });

});

describe("save load actions", () => {

    const appDefinitionWithTriggersAndActions = async () => {
        const {templateApi} = await saveThreeLevelHeirarchy();
        
        const logAction = templateApi.createAction();
        logAction.behaviourName = "log";
        logAction.behaviourSource = "test";
        logAction.name = "log_something";

        const logOnErrorTrigger = templateApi.createTrigger();
        logOnErrorTrigger.actionName = "log_something";
        logOnErrorTrigger.eventName = "recordApi:save:onError";

        return ({
            templateApi, 
            actions:[logAction],
            triggers:[logOnErrorTrigger]
        });

    }

    it("should load actions with exactly the same members", async () => {

        const {templateApi, actions, triggers} = 
            await appDefinitionWithTriggersAndActions();
        
        await templateApi.saveActionsAndTriggers(actions, triggers);

        const appDef = await templateApi.getApplicationDefinition();

        expect(appDef.actions).toEqual(actions);
        expect(appDef.triggers).toEqual(triggers);
    });

    it("should throw error when actions are invalid", async () => {
        const {templateApi, actions, triggers} = 
            await appDefinitionWithTriggersAndActions();
        
        actions[0].name = "";

        let err;
        try {
            await templateApi.saveActionsAndTriggers(actions, triggers);
        } catch (e) {
            err = e;
        }

        expect(err).toBeDefined();
    });

    it("should throw error when triggers are invalid", async () => {
        const {templateApi, actions, triggers} = 
            await appDefinitionWithTriggersAndActions();
        
        triggers[0].eventName = "";

        let err;
        try {
            await templateApi.saveActionsAndTriggers(actions, triggers);
        } catch (e) {
            err = e;
        }

        expect(err).toBeDefined();
    })

});