import {getMemoryTemplateApi} from "./specHelpers";
import {errors} from "../src/templateApi";

describe("heirarchy node creation", () => {

    it("> getNewRootLevel > should be initialised with correct members", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        expect(root.name).toBe("root");
        expect(root.type).toBe("root");
        expect(root.children).toEqual([]);
        expect(root.pathRegx).toBeDefined();
        expect(root.pathRegx()).toBe("/");
        expect(root.parent).toBeDefined();
        expect(root.isRoot()).toBeTruthy();
    });

    it("> getNewRecordTemplate > should be initialise with correct members", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const record  = templateApi.getNewRecordTemplate(root);
        record.name = "child";
        expect(record.type).toBe("record");
        expect(record.children).toEqual([]);
        expect(record.validationRules).toEqual([]);
        expect(record.parent()).toBe(root);
    });

    it("> getNewrecordTemplate > should have static pathRegx if parent is root", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const record  = templateApi.getNewRecordTemplate(root);
        record.name = "child";
        expect(record.pathRegx()).toBe("/child");
    });

    it("> getNewrecordTemplate > should add itself to collections's children", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const collection = templateApi.getNewCollectionTemplate(root);
        const record  = templateApi.getNewRecordTemplate(collection);
        expect(collection.children.length).toBe(1);
        expect(collection.children[0]).toBe(record);
    });

    it("> getNewrecordTemplate > should add itself to root's children", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const record  = templateApi.getNewRecordTemplate(root);
        expect(root.children.length).toBe(1);
        expect(root.children[0]).toBe(record);
    });

    it("> getNewrecordTemplate > should have dynamic pathRegx if parent is collection", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const collection = templateApi.getNewCollectionTemplate(root);
        collection.name = "customers"
        const record  = templateApi.getNewRecordTemplate(collection);
        record.name = "child";
        expect(record.pathRegx().startsWith("/customers")).toBe(true);
        expect(record.pathRegx().includes("[")).toBe(true);
    });

    it("> getNewCollectionTemplate > should initialise with correct members", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const collection = templateApi.getNewCollectionTemplate(root);
        collection.name = "customers";
        expect(collection.type).toBe("collection");
        expect(collection.parent()).toBe(root);
        expect(collection.pathRegx()).toBe("/customers")
    });

    it("> getNewCollectionTemplate > should add default view", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const collection = templateApi.getNewCollectionTemplate(root);
        collection.name = "customers";
        expect(collection.views.length).toBe(1);
        expect(collection.views[0].name).toBe("default");
        expect(collection.views[0].index).toBeDefined();
    });

    it("> getNewCollectionTemplate > should add itself to root's children", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const collection = templateApi.getNewCollectionTemplate(root);
        expect(root.children.length).toBe(1);
        expect(root.children[0]).toBe(collection);
    });

    it("> getNewCollectionTemplate > should add itself to record's children", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const record = templateApi.getNewRecordTemplate(root);
        const collection = templateApi.getNewCollectionTemplate(record);
        expect(record.children.length).toBe(1);
        expect(record.children[0]).toBe(collection);
    });

    it("> getNewViewTemplate > should initialise with correct members", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const view = templateApi.getNewViewTemplate(root);
        expect(view.type).toBe("view");
        expect(view.name).toBeDefined();
        expect(view.index).toBeDefined();
        expect(view.index.map).toBeDefined();
        expect(view.index.filter).toBeDefined();
        expect(view.children).toBeUndefined();
        view.name = "naughty-customers";
        expect(view.pathRegx()).toBe("/naughty-customers");
        expect(view.parent()).toBe(root);
    });

    it("> getNewViewTemplate > should add itself to roots children", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const view = templateApi.getNewViewTemplate(root);
        expect(root.children.length).toBe(1);
        expect(root.children[0]).toBe(view);
    });

    it("> getNewViewTemplate > should add itself to collection views", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const collection = templateApi.getNewCollectionTemplate(root);
        const view = templateApi.getNewViewTemplate(collection);
        expect(collection.views.length).toBe(2);
        expect(collection.views[1]).toBe(view);
        expect(view.parent()).toBe(collection);
    });

    it("should throw exception when view is supplied as parent", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const view = templateApi.getNewViewTemplate(root);
        expect(() => templateApi.getNewCollectionTemplate(view))
        .toThrow(errors.viewCannotBeParent);
        expect(() => templateApi.getNewRecordTemplate(view))
        .toThrow(errors.viewCannotBeParent);
    });

    it("should throw exception when view is add to record", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const record = templateApi.getNewRecordTemplate(root);
        expect(() => templateApi.getNewViewTemplate(record))
        .toThrow(errors.viewParentMustBeCollectionOrRoot);
    });

    it("should throw exception when no parent supplied, for non root node", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        expect(() => templateApi.getNewCollectionTemplate())
        .toThrow(errors.allNonRootNodesMustHaveParent);
        expect(() => templateApi.getNewRecordTemplate())
        .toThrow(errors.allNonRootNodesMustHaveParent);
    });

    it("> adding node > should just add one (bugfix)", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const collection = templateApi.getNewCollectionTemplate(root);
        templateApi.getNewRecordTemplate(collection);

        expect(root.children.length).toBe(1);
        expect(collection.children.length).toBe(1);
    });
});