import {getMemoryTemplateApi} from "./specHelpers";
import { isEqual } from "lodash";

describe("Load & Save App Heirarchy", () => {

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