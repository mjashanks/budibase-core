import {getAppApis} from "../src";
import {getMemoryTemplateApi} from "./specHelpers";

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