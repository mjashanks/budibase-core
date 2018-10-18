import {getMemoryStore} from "./specHelpers";
import getIndexing from "../src/indexing";
import {uniqueIndexName} from "../src/indexing/read";
import {includes} from "lodash";

describe("indexing.createIndexFile", () => {

    it("should create a document with a csv header row, with fields based on index map function", async () => {
        const datastore = getMemoryStore();
        const indexing = getIndexing({datastore}); // appheirarchy not used

        const index = {map : "return {name: record.name, age: record.age}", filter:""};
        const indexKey = `/customers/hello`;
        await indexing.createIndexFile(indexKey, index);

        const savedIndex = await datastore.loadFile(indexKey);
        const headers = savedIndex.split(",");

        expect(headers.length).toBe(3); // mapped fields, plus key

        expect(includes(headers, "name")).toBeTruthy();
        expect(includes(headers, "age")).toBeTruthy();
        expect(includes(headers, "key")).toBeTruthy();
    });

});