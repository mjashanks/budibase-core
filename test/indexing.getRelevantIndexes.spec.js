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
            some(indexes.collections, c => c.path === key);
        
        expect(indexExists("/customers/default")).toBeTruthy();
        expect(indexExists("/customers/customersBySurname")).toBeTruthy();
        expect(indexExists("/customers/deceased")).toBeTruthy();
        expect(indexExists("/customers/invoices")).toBeTruthy();
    });

    it("should get 2 default indexes when 2 collections nested deep", async () => {
        const {recordApi, appHeirarchy} = await setupAppheirarchy(
        basicAppHeirarchyCreator_WithFields_AndIndexes);

        const invoice  = recordApi.getNew("/customers/0-1234/invoices", "invoice")

        const indexes = getRelevantHeirarchalIndexes(
            appHeirarchy.root, invoice);

        expect(indexes.collections.length).toBe(6);
        expect(some(indexes.collections, i => i.path === "/customers/default")).toBeTruthy();
        expect(some(indexes.collections, i => i.path === "/customers/0-1234/invoices/default")).toBeTruthy();
    });

    it("should get reverseReferenceIndex accross heirarchy branches", async () => {
        const {appHeirarchy,
                recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        
        const partner = recordApi.getNew("/partners", "partner");
        partner.businessName = "acme inc";
        //await recordApi.save(partner);

        const customer = recordApi.getNew("/customers", "customer");
        customer.partner = {key:partner.key(), value:partner.businessName};
        //await recordApi.save(customer);
        
        
        const indexes = getRelevantReverseReferenceIndexes(
            appHeirarchy.root, customer);
        expect(indexes.length).toBe(1);
        expect(indexes[0].path)
        .toBe(joinKey(partner.key(), appHeirarchy.partnerCustomersReverseIndex.name));


    });

    it("should get reverseReferenceIndex when referencing record in same collection", async () => {
        const {appHeirarchy,
                recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        
        const referredByCustomer = recordApi.getNew("/customers", "customer");
        referredByCustomer.surname = "ledog";

        const referredToCustomer = recordApi.getNew("/customers", "customer");
        referredToCustomer.referredBy = {key:referredByCustomer.key(), value:"ledog"};        
        
        const indexes = getRelevantReverseReferenceIndexes(
            appHeirarchy.root, referredToCustomer);
        expect(indexes.length).toBe(1);
        expect(indexes[0].path)
        .toBe(joinKey(referredByCustomer.key(), appHeirarchy.referredToCustomersReverseIndex.name));

    });
});