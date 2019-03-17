import {getMemoryTemplateApi, basicAppHeirarchyCreator_WithFields_AndIndexes} from "./specHelpers";
import {initialiseData} from "../src/appInitialise/initialiseData";
import {TRANSACTIONS_FOLDER} from "../src/transactions/transactionsCommon";
import {AUTH_FOLDER, USERS_LIST_FILE, ACCESS_LEVELS_FILE} from "../src/authApi/authCommon";

describe("initialiseData", () => {

    it("should create csv file for each index, when does not exist", async () => {
        const {appDef, datastore} = getApplicationDefinition();
        await initialiseData(datastore, appDef);
    
        expect(await datastore.exists(`/customers/default/index.csv`)).toBeTruthy();
        expect(await datastore.exists(`/customers/default`)).toBeTruthy();
        expect(await datastore.exists(`/customers/deceased/index.csv`)).toBeTruthy();
        expect(await datastore.exists(`/customers/deceased`)).toBeTruthy();
    });

    it("should create folder for collection", async () => {
        const {appDef, datastore} = getApplicationDefinition();
        await initialiseData(datastore, appDef);
        expect(await datastore.exists(`/customers`)).toBeTruthy();
    });


    it("should create allids folders", async () => {
        const {appDef, datastore, h} = getApplicationDefinition();
        await initialiseData(datastore, appDef);

        const allIdsTypeFolder = "/customers/allids/" + h.customerRecord.recordNodeId;
        const allIdsFolder = "/customers/allids";
        expect(await datastore.exists(allIdsTypeFolder)).toBeTruthy();
        expect(await datastore.exists(allIdsFolder)).toBeTruthy();
    });

    it("should create transactions folder", async () => {
        const {appDef, datastore} = getApplicationDefinition();
        await initialiseData(datastore, appDef);
        expect(await datastore.exists(TRANSACTIONS_FOLDER)).toBeTruthy();
    });

    it("should create auth folder", async () => {
        const {appDef, datastore} = getApplicationDefinition();
        await initialiseData(datastore, appDef);
        expect(await datastore.exists(AUTH_FOLDER)).toBeTruthy();
    });

    it("should create users list", async () => {
        const {appDef, datastore} = getApplicationDefinition();
        await initialiseData(datastore, appDef);
        expect(await datastore.exists(USERS_LIST_FILE)).toBeTruthy();
    });

    it("should create access levels file", async () => {
        const {appDef, datastore} = getApplicationDefinition();
        await initialiseData(datastore, appDef);
        expect(await datastore.exists(ACCESS_LEVELS_FILE)).toBeTruthy();
    });

    const getApplicationDefinition = () => {
        const {templateApi, app} = getMemoryTemplateApi();
        const h = basicAppHeirarchyCreator_WithFields_AndIndexes(templateApi);
        return {appDef:{heirarchy:h.root, actions:[], triggers:[]}, datastore:app.datastore, h};
    }

});