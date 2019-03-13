import {setupAppheirarchy, basicAppHeirarchyCreator_WithFields_AndIndexes} from "./specHelpers";
import {initialiseData} from "../src/appInitialise/initialiseData";

describe("initialiseData", () => {

    it("should create csv file for each index, when does not exist", async () => {
        await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
    
        expect(await collectionApi._store.exists(`/customers/default/index.csv`)).toBeTruthy();
        expect(await collectionApi._store.exists(`/customers/default`)).toBeTruthy();
        expect(await collectionApi._store.exists(`/customers/deceased/index.csv`)).toBeTruthy();
        expect(await collectionApi._store.exists(`/customers/deceased`)).toBeTruthy();
    });

    it("should create folder for collection", async () => {

        await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        expect(await collectionApi._store.exists(`/customers`)).toBeTruthy();
    });

    it("should not overwrite existing index files", async () => {
        await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);

        const defaultIndexName = "/customers/default/index.csv";
        const deceasedIndexName = "/customers/deceased/index.csv";

        await collectionApi._store.updateFile(defaultIndexName, "default test");
        await collectionApi._store.updateFile(deceasedIndexName, "deceased test");
        
        await collectionApi.initialiseAll();

        const defaultIndexContent = await collectionApi._store.loadFile(defaultIndexName);
        const deceasedIndexContent = await collectionApi._store.loadFile(deceasedIndexName);

        expect(defaultIndexContent).toBe("default test");
        expect(deceasedIndexContent).toBe("deceased test");
    });

    it("should create allids folders", async () => {
        const {collectionApi, appHeirarchy} = 
            await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);

        await collectionApi.initialiseAll();

        const allIdsTypeFolder = "/customers/allids/" + appHeirarchy.customerRecord.recordNodeId;
        const allIdsFolder = "/customers/allids";
        expect(await collectionApi._store.exists(allIdsTypeFolder)).toBeTruthy();
        expect(await collectionApi._store.exists(allIdsFolder)).toBeTruthy();
    });

});