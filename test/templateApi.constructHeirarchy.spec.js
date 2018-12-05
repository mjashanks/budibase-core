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
        expect(root.indexes).toEqual([]);
    });

    it("> getNewRecordTemplate > should be initialise with correct members", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const record  = templateApi.getNewRecordTemplate(root);
        record.name = "child";
        expect(record.type).toBe("record");
        expect(record.children).toEqual([]);
        expect(record.validationRules).toEqual([]);
        expect(record.indexes).toEqual([]);
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

    it("> getNewCollectionTemplate > should add default index", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const collection = templateApi.getNewCollectionTemplate(root);
        collection.name = "customers";
        expect(collection.indexes.length).toBe(1);
        expect(collection.indexes[0].name).toBe("default");
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

    it("> getNewIndexTemplate > should initialise with correct members", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const index = templateApi.getNewIndexTemplate(root);
        expect(index.type).toBe("index");
        expect(index.name).toBeDefined();
        expect(index.map).toBeDefined();
        expect(index.filter).toBeDefined();
        expect(index.children).toBeUndefined();
        expect(index.indexType).toBe("heirarchal");
        expect(index.getShardName).toBeDefined();
        index.name = "naughty-customers";
        expect(index.pathRegx()).toBe("/naughty-customers");
        expect(index.parent()).toBe(root);
    });

    it("> getNewIndexTemplate > should add itself to roots indexes", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const index = templateApi.getNewIndexTemplate(root);
        expect(root.indexes.length).toBe(1);
        expect(root.indexes[0]).toBe(index);
    });

    it("> getNewIndexTemplate > should add itself to collection indexes", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const collection = templateApi.getNewCollectionTemplate(root);
        const index = templateApi.getNewIndexTemplate(collection);
        expect(collection.indexes.length).toBe(2);
        expect(collection.indexes[1]).toBe(index);
        expect(index.parent()).toBe(collection);
    });

    it("should throw exception when index is supplied as parent", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const index = templateApi.getNewIndexTemplate(root);
        expect(() => templateApi.getNewCollectionTemplate(index))
        .toThrow(errors.indexCannotBeParent);
        expect(() => templateApi.getNewRecordTemplate(index))
        .toThrow(errors.indexCannotBeParent);
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