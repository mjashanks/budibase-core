import {getMemoryTemplateApi, 
        basicAppHeirarchyCreator_WithFields, 
        setupAppheirarchy, 
        basicAppHeirarchyCreator_WithFields_AndIndexes} from "./specHelpers";
import {getRelevantIndexes} from "../src/indexing/relevant";
import {some} from "lodash";

describe("getRelevantIndexes", () => {

    it("should get indexes only, when key is root level record", async () => {
        const {appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndIndexes);
        
        const indexesByPath = getRelevantIndexes(appHeirarchy.root, {
            appName:"hello", 
            key: () => "/settings"});


        expect(indexesByPath.globalIndexes.length).toBeGreaterThan(0);
        expect(indexesByPath.collections.length).toBe(0);
        expect(indexesByPath.reverseReference.length).toBe(0);
        
    });

    it("should get collection default index, when key is child of root level collection", async () => {
        const {recordApi, 
                appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndIndexes);
        
        const customer = recordApi.getNew("/customers", "customer");

        const indexes = getRelevantIndexes(appHeirarchy.root, customer);

        expect(indexes.collections.length).toBe(3);
        expect(indexes.collections[0].path).toBe("/customers/default");
        expect(indexes.collections[1].path).toBe("/customers/deceased");
        expect(indexes.collections[2].path).toBe("/customers/invoices");
    });

    it("should get 2 default indexes when 2 collections nested deep", async () => {
        const {recordApi, appHeirarchy} = await setupAppheirarchy(
        basicAppHeirarchyCreator_WithFields_AndIndexes);

        const invoice  = recordApi.getNew("/customers/0-1234/invoices", "invoice")

        const indexes = getRelevantIndexes(appHeirarchy.root, invoice);

        expect(indexes.collections.length).toBe(4);
        expect(some(indexes.collections, i => i.path === "/customers/default")).toBeTruthy();
        expect(some(indexes.collections, i => i.path === "/customers/0-1234/invoices/default")).toBeTruthy();
    });

    it("should get reverseReferenceIndex accross heirarchy branches", async () => {
        const {appHeirarchy, partnerCustomersReverseIndex,
                recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        
        const partner = recordApi.getNew("/partners", "partner");
        partner.businessName = "acme inc";
        //await recordApi.save(partner);

        const customer = recordApi.getNew("/customers", "customer");
        customer.partner = {key:partner.key(), value:partner.businessName};
        //await recordApi.save(customer);
        
        
        const indexes = getRelevantIndexes(appHeirarchy.root, customer);
        expect(indexes.reverseReference.length).toBe(1);
        expect(indexes.reverseReference[0].path).toBe(partnerCustomersReverseIndex.nodeKey());
        /*
        const templateApi = await getMemoryTemplateApi();
        const root = templateApi.getNewRootLevel();
        const rootLevelCollection1 = templateApi.getNewCollectionTemplate(root);
        rootLevelCollection1.name = "customers";

        const recordNode1 = templateApi.getNewRecordTemplate(rootLevelCollection1);
        recordNode1.name = "customer";
        const referenceField = templateApi.getNewField("reference");
        referenceField.name = "partner";
        referenceField.typeOptions.indexNodeKey = "/partners/default";
        referenceField.typeOptions.displayValue = 
*/

    });
});