import {getApis} from "./specHelpers";
import {getRelevantIndexes} from "../src/indexing/relevant";

describe("getRelevantIndexes", () => {

    it("should get view indexes only, when key is root level record", async () => {
        const {templateApi} = await getApis();
        const root = templateApi.getNewRootLevel();
        const rootLevelRecord = templateApi.getNewRecordTemplate(root);

        rootLevelRecord.name = "customer";

        const view = templateApi.getNewViewTemplate(root);
        view.index.name = "test index";
        view.name = "naughty-customers";
        
        const indexesByPath = getRelevantIndexes(root, "/customer");

        expect(indexesByPath.globalViews.length).toBe(1);
        expect(indexesByPath.globalViews[0].viewNode.index.name).toBe("test index");
        expect(indexesByPath.globalViews[0].path).toBe("/naughty-customers");
        
    });

    it("should get view indexes, when view is nested in group", async () => {
        const {templateApi} = await getApis();
        const root = templateApi.getNewRootLevel();
        const rootLevelRecord = templateApi.getNewRecordTemplate(root);

        rootLevelRecord.name = "customer";

        const viewRootGroup = templateApi.getNewGroupTemplate(root);
        viewRootGroup.name = "Views";
        const viewSubGroup = templateApi.getNewGroupTemplate(viewRootGroup);
        viewSubGroup.name = "ViewSub";
        const view = templateApi.getNewViewTemplate(viewSubGroup);
        view.index.name = "test index";
        view.name = "testview";
        
        const indexes = getRelevantIndexes(root, "/customer");

        expect(indexes.globalViews.length).toBe(1);
        expect(indexes.globalViews[0].viewNode.index.name).toBe("test index");
        expect(indexes.globalViews[0].path).toBe("/Views/ViewSub/testview");
        
    });

    it("should get collection default view index, when key is child of root level collection", async () => {
        const {templateApi} = await getApis();
        const root = templateApi.getNewRootLevel();
        const rootLevelCollection = templateApi.getNewCollectionTemplate(root);
        rootLevelCollection.name = "customers";

        const recordTemplate = templateApi.getNewRecordTemplate(rootLevelCollection);
        recordTemplate.name = "customer";

        const indexes = getRelevantIndexes(root, "/customers/1234");

        expect(indexes.collections.length).toBe(1);
        expect(indexes.collections[0].path).toBe("/customers/default");
    });

    it("should get collection default view index, when key is child of group level collection", async () => {
        const {templateApi} = await getApis();
        const root = templateApi.getNewRootLevel();
        const group = templateApi.getNewGroupTemplate(root);
        group.name = "main";
        const rootLevelCollection = templateApi.getNewCollectionTemplate(group);
        rootLevelCollection.name = "customers";

        const recordTemplate = templateApi.getNewRecordTemplate(rootLevelCollection);
        recordTemplate.name = "customer";
        
        const indexes = getRelevantIndexes(root, "/main/customers/1234");

        expect(indexes.collections.length).toBe(1);
        expect(indexes.collections[0].path).toBe("/main/customers/default");
    });

    it("should get 2 default view indexes when 2 collections nested deep", async () => {
        const {templateApi} = await getApis();
        const root = templateApi.getNewRootLevel();
        const group = templateApi.getNewGroupTemplate(root);
        group.name = "main";
        const groupLevelCollection = templateApi.getNewCollectionTemplate(group);
        groupLevelCollection.name = "customers";

        const firstRecordTemplate = templateApi.getNewRecordTemplate(groupLevelCollection);
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