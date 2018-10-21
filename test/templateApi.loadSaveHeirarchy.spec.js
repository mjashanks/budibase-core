import {getApis} from "./specHelpers";
import { isEqual } from "lodash";

describe("Load & Save App Heirarchy", () => {

    const saveThreeLevelHeirarchy = async () => {
        const {templateApi} = await getApis();
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
        const loadedRoot = await templateApi.getApplicationHeirarchy();

        expect(loadedRoot.pathRegx).toBeDefined();
        expect(loadedRoot.children[0].pathRegx).toBeDefined();
        expect(loadedRoot.children[0].children[0].pathRegx).toBeDefined();

    });

    it("should rehydrate json objects with parent methods", async () => {

        const {templateApi} = await saveThreeLevelHeirarchy();
        const loadedRoot = await templateApi.getApplicationHeirarchy();

        expect(loadedRoot.parent).toBeDefined();
        expect(loadedRoot.children[0].parent).toBeDefined();
        expect(loadedRoot.children[0].children[0].parent).toBeDefined();

    });

    it("should load heirarchy with exactly the same members - balls deep", async () => {

        const {templateApi, root} = await saveThreeLevelHeirarchy();
        const loadedRoot = await templateApi.getApplicationHeirarchy();

        expect(JSON.stringify(loadedRoot))
        .toEqual(JSON.stringify(root));
    });

    it("should throw an error when app heirarchy does not exist", async () => {
        expect(async () => await templateApi.getApplicationHeirarchy())
        .toThrow();
    });

});