import {getAppApis} from "../src";
import memory from "../src/datastores/memory";
describe("getAppApis", () => {

    const getMemoryAppApis = async () => await getAppApis(memory({}));

    it("should return api factory functions", async () => {
        const apis = await getMemoryAppApis();
        expect(apis.recordApi).toBeDefined();
        expect(apis.templateApi).toBeDefined();
    });

});