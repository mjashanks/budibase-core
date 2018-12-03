import {setupAppheirarchy, basicAppHeirarchyCreator_WithFields,
    basicAppHeirarchyCreator_WithFields_AndIndexes} from "./specHelpers";
import {includes, union} from "lodash";
import {joinKey} from "../src/common";

describe("collectionApi > initialiseAll", () => {

    it("should create csv file for each index, when does not exist", async () => {
        const {collectionApi, appHeirarchy} = 
            await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
    
        await collectionApi.initialiseAll();

        expect(await collectionApi._store.exists(`/customers/default.csv`)).toBeTruthy();
        expect(await collectionApi._store.exists(`/customers/deceased.csv`)).toBeTruthy();
    });

    it("should create folder for collection", async () => {
        const {collectionApi} = 
            await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);

        await collectionApi.initialiseAll();

        expect(await collectionApi._store.exists(`/customers`)).toBeTruthy();
    });

    it("should not overwrite existing index files", async () => {
        const {collectionApi, appHeirarchy} = 
            await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);

        const defaultIndexName = "/customers/default.csv";
        const deceasedIndexName = "/customers/deceased.csv";

        await collectionApi._store.updateFile(defaultIndexName, "default test");
        await collectionApi._store.updateFile(deceasedIndexName, "deceased test");
        
        await collectionApi.initialiseAll();

        const defaultIndexContent = await collectionApi._store.loadFile(defaultIndexName);
        const deceasedIndexContent = await collectionApi._store.loadFile(deceasedIndexName);

        expect(defaultIndexContent).toBe("default test");
        expect(deceasedIndexContent).toBe("deceased test");
    });

    it("should create allids folders", async () => {
        const {collectionApi} = 
            await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);

        await collectionApi.initialiseAll();

        const allIdsTypeFolder = "/customers/allids/0";
        const allIdsFolder = "/customers/allids";
        expect(await collectionApi._store.exists(allIdsTypeFolder)).toBeTruthy();
        expect(await collectionApi._store.exists(allIdsFolder)).toBeTruthy();
    });

});

describe("collectionApi > getAllowedRecordTypes", () => {

    it("should list names of a collection's children", async () => {
        const {collectionApi} = 
            await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);

        const allowedTypes = collectionApi.getAllowedRecordTypes("/customers");
        expect(allowedTypes).toEqual(["customer"]);
    });

});


describe("collectionApi > allids", () => {

    it("should add new record to comma separated, sharded allids file, then read back as id array", async () => {
        const {collectionApi, recordApi, appHeirarchy} = 
            await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);

        const customer1 = await recordApi.getNew(
            appHeirarchy.customersCollection.nodeKey(), "customer");
        customer1.surname = "thedog";
        
        await recordApi.save(customer1);
        
        const customer2 = await recordApi.getNew(
            appHeirarchy.customersCollection.nodeKey(), "customer");
        customer2.surname = "thedog";
        
        await recordApi.save(customer2);

        const allIdsIterator = await collectionApi.getAllIdsIterator("/customers");
        let allIds = [];

        let shardIds = await allIdsIterator();
        while(shardIds.done === false) {
            allIds = union(allIds, shardIds.result.ids);
            shardIds = await allIdsIterator();
        }

        expect(allIds.length).toBe(2);
        expect(includes(allIds, customer1.id())).toBeTruthy();
        expect(includes(allIds, customer2.id())).toBeTruthy();
        
    });

    it("delete record should remove id from allids shard", async () => {
        const {collectionApi, recordApi, appHeirarchy} = 
            await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);

        const customer1 = await recordApi.getNew(
            appHeirarchy.customersCollection.nodeKey(), "customer");
        customer1.surname = "thedog";
        
        await recordApi.save(customer1);
        
        const customer2 = await recordApi.getNew(
            appHeirarchy.customersCollection.nodeKey(), "customer");
        customer2.surname = "thedog";
        
        await recordApi.save(customer2);
        
        await recordApi.delete(customer1.key());

        const allIdsIterator = await collectionApi.getAllIdsIterator("/customers");
        let allIds = [];

        let shardIds = await allIdsIterator();
        while(shardIds.done === false) {
            allIds = union(allIds, shardIds.result.ids);
            shardIds = await allIdsIterator();
        }

        expect(allIds.length).toBe(1);
        expect(includes(allIds, customer2.id())).toBeTruthy();
        
    });

    it("should add and read record, that starts with any allowed key char (testing correct sharding of allids)", async () => {

        const allIdChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-".split("");

        const {collectionApi, recordApi, appHeirarchy} = 
            await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);

        for(let c of allIdChars) {
            const customer = await recordApi.getNew(
                appHeirarchy.customersCollection.nodeKey(), "customer");
            customer.surname = "thedog";   
            const id = `0-${c}${customer.id().replace("0-","")}`;
            customer.id = () => id;
            await recordApi.save(customer); 
        }        

        const allIdsIterator = await collectionApi.getAllIdsIterator("/customers");
        let allIds = [];

        let shardIds = await allIdsIterator();
        while(shardIds.done === false) {
            allIds = union(allIds, shardIds.result.ids);
            shardIds = await allIdsIterator();
        }

        expect(allIds.length).toBe(64);
    });

    it("should add nested record and read back", async () => {
        const {collectionApi, recordApi, appHeirarchy} = 
            await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);

        const customer = await recordApi.getNew(
            appHeirarchy.customersCollection.nodeKey(), "customer");
        customer.surname = "thedog";
        
        await recordApi.save(customer);
        
        const invoiceCollectionKey = joinKey(
            customer.key(), "invoices"
        );

        const invoice = await recordApi.getNew(
            invoiceCollectionKey, "invoice");
        
        await recordApi.save(invoice);

        const allIdsIterator = await collectionApi.getAllIdsIterator(
            appHeirarchy.invoicesCollection.nodeKey());

        let allIds = [];

        let shardIds = await allIdsIterator();
        while(shardIds.done === false) {
            allIds = union(allIds, shardIds.result.ids);
            shardIds = await allIdsIterator();
        }

        expect(allIds.length).toBe(1);
        expect(includes(allIds, invoice.id())).toBeTruthy();
        
    });

    it("should add double nested record, and read back", async () => {
        const {collectionApi, recordApi, appHeirarchy} = 
        await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);

        const customer = await recordApi.getNew(
            appHeirarchy.customersCollection.nodeKey(), "customer");
        customer.surname = "thedog";
        
        await recordApi.save(customer);
        
        const invoiceCollectionKey = joinKey(
            customer.key(), "invoices"
        );

        const invoice = await recordApi.getNew(
            invoiceCollectionKey, "invoice");
        
        await recordApi.save(invoice);

        const chargeCollectionKey = joinKey(
            invoice.key(), "charges"
        );

        const charge = await recordApi.getNew(
            chargeCollectionKey, "charge");
        
        await recordApi.save(charge);

        const allIdsIterator = await collectionApi.getAllIdsIterator(
            appHeirarchy.chargesCollection.nodeKey());

        let allIds = [];

        let shardIds = await allIdsIterator();
        while(shardIds.done === false) {
            allIds = union(allIds, shardIds.result.ids);
            shardIds = await allIdsIterator();
        }

        expect(allIds.length).toBe(1);
        expect(includes(allIds, charge.id())).toBeTruthy();
    });

});