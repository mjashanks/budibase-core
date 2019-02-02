import {getMemoryTemplateApi, 
        basicAppHeirarchyCreator_WithFields, 
        setupAppheirarchy, 
        basicAppHeirarchyCreator_WithFields_AndIndexes} from "./specHelpers";
import {getRelevantHeirarchalIndexes,
        getRelevantReverseReferenceIndexes} from "../src/indexing/relevant";
import {some} from "lodash";
import {joinKey} from "../src/common";

describe("getRelevantIndexes", () => {

    it("should get indexes only, when key is root level record", async () => {
        const {appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndIndexes);
        
        const heirarchalIndexesByPath = getRelevantHeirarchalIndexes(
            appHeirarchy.root, {
                appName:"hello", 
                key: () => "/settings"
            }
        );

        const reverseReferenceIndexesByPath = getRelevantReverseReferenceIndexes(
            appHeirarchy.root, {
                appName:"hello", 
                key: () => "/settings"
            }
        );

        expect(heirarchalIndexesByPath.globalIndexes.length).toBeGreaterThan(0);
        expect(heirarchalIndexesByPath.collections.length).toBe(0);
        expect(reverseReferenceIndexesByPath.length).toBe(0);
        
    });

    it("should get collection default index, when key is child of root level collection", async () => {
        const {recordApi, 
                appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndIndexes);
        
        const customer = recordApi.getNew("/customers", "customer");

        const indexes = getRelevantHeirarchalIndexes(
            appHeirarchy.root, customer);

        expect(indexes.collections.length).toBe(4);
        
        const indexExists = key => 
            some(indexes.collections, c => c.indexKey === key);
        
        expect(indexExists("/customers/default")).toBeTruthy();
        expect(indexExists("/customers/deceased")).toBeTruthy();
        expect(indexExists("/customers/customersBySurname")).toBeTruthy();
        expect(indexExists("/customers/invoices")).toBeTruthy();
    });

    it("should ignore index when allowedRecordNodeIds does not contain record's node id", async () => {
        const {recordApi, 
                appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndIndexes);
        
        const customer = recordApi.getNew("/customers", "customer");
        const invoice = recordApi.getNew(joinKey(customer.key, "invoices"), "invoice");

        const indexes = getRelevantHeirarchalIndexes(
            appHeirarchy.root, invoice);
        
        const indexExists = key => 
            some(indexes.collections, c => c.indexKey === key);

        expect(indexExists("/customers/customersBySurname")).toBeFalsy();
    });

    it("should include index when allowedRecordNodeIds contains record's node id", async () => {
        const {recordApi, 
                appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndIndexes);
        
        const customer = recordApi.getNew("/customers", "customer");

        const indexes = getRelevantHeirarchalIndexes(
            appHeirarchy.root, customer);

        expect(indexes.collections.length).toBe(4);
        
        const indexExists = key => 
            some(indexes.collections, c => c.indexKey === key);

        expect(indexExists("/customers/customersBySurname")).toBeTruthy();
    });

    it("should get default index and relevant parent index when record is 2 nested collections deep", async () => {
        const {recordApi, appHeirarchy} = await setupAppheirarchy(
        basicAppHeirarchyCreator_WithFields_AndIndexes);

        const nodeid = appHeirarchy.customerRecord.recordNodeId;
        const invoice  = recordApi.getNew(`/customers/${nodeid}-1234/invoices`, "invoice")

        const indexes = getRelevantHeirarchalIndexes(
            appHeirarchy.root, invoice);

        expect(indexes.collections.length).toBe(4);
        expect(some(indexes.collections, i => i.indexKey === "/customers/invoices")).toBeTruthy();
        expect(some(indexes.collections, i => i.indexKey === `/customers/${nodeid}-1234/invoices/default`)).toBeTruthy();
    });

    it("should get reverseReferenceIndex accross heirarchy branches", async () => {
        const {appHeirarchy,
                recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        
        const partner = recordApi.getNew("/partners", "partner");
        partner.businessName = "acme inc";
        //await recordApi.save(partner);

        const customer = recordApi.getNew("/customers", "customer");
        customer.partner = {key:partner.key, value:partner.businessName};
        //await recordApi.save(customer);
        
        
        const indexes = getRelevantReverseReferenceIndexes(
            appHeirarchy.root, customer);
        expect(indexes.length).toBe(1);
        expect(indexes[0].indexKey)
        .toBe(joinKey(partner.key, appHeirarchy.partnerCustomersReverseIndex.name));


    });

    it("should get reverseReferenceIndex when referencing record in same collection", async () => {
        const {appHeirarchy,
                recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        
        const referredByCustomer = recordApi.getNew("/customers", "customer");
        referredByCustomer.surname = "ledog";

        const referredToCustomer = recordApi.getNew("/customers", "customer");
        referredToCustomer.referredBy = {key:referredByCustomer.key, value:"ledog"};        
        
        const indexes = getRelevantReverseReferenceIndexes(
            appHeirarchy.root, referredToCustomer);
        expect(indexes.length).toBe(1);
        expect(indexes[0].indexKey)
        .toBe(joinKey(referredByCustomer.key, appHeirarchy.referredToCustomersReverseIndex.name));
    });
});