import {getMemoryTemplateApi} from "./specHelpers";
import {getRelevantIndexes} from "../src/indexing/relevant";

describe("getRelevantIndexes", () => {

    it("should get indexes only, when key is root level record", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const rootLevelRecord = templateApi.getNewRecordTemplate(root);

        rootLevelRecord.name = "customer";

        const index = templateApi.getNewIndexTemplate(root);
        index.name = "naughty-customers";
        
        const indexesByPath = getRelevantIndexes(root, "/customer");

        expect(indexesByPath.globalIndexes.length).toBe(1);
        expect(indexesByPath.globalIndexes[0].path).toBe("/naughty-customers");
        
    });

    it("should get collection default index, when key is child of root level collection", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const rootLevelCollection = templateApi.getNewCollectionTemplate(root);
        rootLevelCollection.name = "customers";

        const recordTemplate = templateApi.getNewRecordTemplate(rootLevelCollection);
        recordTemplate.name = "customer";

        const indexes = getRelevantIndexes(root, "/customers/1234");

        expect(indexes.collections.length).toBe(1);
        expect(indexes.collections[0].path).toBe("/customers/default");
    });

    it("should get 2 default indexes when 2 collections nested deep", async () => {
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const rootLevelCollection = templateApi.getNewCollectionTemplate(root);
        rootLevelCollection.name = "customers";

        const firstRecordTemplate = templateApi.getNewRecordTemplate(rootLevelCollection);
        firstRecordTemplate.name = "customer";
        
        const recordLevelCollection = templateApi.getNewCollectionTemplate(firstRecordTemplate);
        recordLevelCollection.name = "tasks";

        const secondRecordTemplate = templateApi.getNewRecordTemplate(recordLevelCollection);
        secondRecordTemplate.name = "task";

        const indexes = getRelevantIndexes(root, "/main/customers/0-1234/tasks/0-5678");

        expect(indexes.collections.length).toBe(2);
        expect(indexes.collections[0].path).toBe("/main/customers/default");
        expect(indexes.collections[1].path).toBe("/main/customers/0-1234/tasks/default");

    });
});