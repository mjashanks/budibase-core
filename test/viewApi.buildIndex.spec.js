import {setupAppheirarchy, basicAppHeirarchyCreator_WithFields_AndIndexes} from "./specHelpers";
import { joinKey } from "../src/common";
import {some} from "lodash";
import {getIndexedDataKey_fromIndexKey} from "../src/indexing/read";

describe("buildIndex > Global index", () => {

    it("should index a record when record node is not decendant", async () => {
        const {recordApi, indexApi, appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndIndexes
        );

        const customer = recordApi.getNew(
            appHeirarchy.customersCollection.nodeKey(),
            "customer");
        
        customer.surname = "thedog";
        
        await recordApi.save(customer);

        const outstandingInvoice = recordApi.getNewChild(
            customer.key(),
            "invoices",
            "invoice"
        );

        outstandingInvoice.totalIncVat = 100;
        outstandingInvoice.paidAmount = 50;

        await recordApi.save(outstandingInvoice);

        const paidInvoice = recordApi.getNewChild(
            customer.key(),
            "invoices",
            "invoice"
        );

        paidInvoice.totalIncVat = 200;
        paidInvoice.paidAmount = 200;

        await recordApi.save(paidInvoice);

        const indexKey = appHeirarchy.outstandingInvoicesIndex.nodeKey();
        await recordApi._storeHandle.deleteFile(
            getIndexedDataKey_fromIndexKey(indexKey)
        );

        await indexApi.buildIndex(indexKey);
        const indexItems = await indexApi.listItems(indexKey);

        expect(indexItems.length).toBe(1);
        expect(indexItems[0].key).toBe(outstandingInvoice.key());
    });

    it("should index records from 2 seperate tree branches", async () => {
        const {recordApi, indexApi, appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndIndexes
        );

        const customer = recordApi.getNew(
            appHeirarchy.customersCollection.nodeKey(),
            "customer");
        
        customer.surname = "thedog";
        
        await recordApi.save(customer);

        const invoice = recordApi.getNewChild(
            customer.key(),
            "invoices",
            "invoice"
        );

        invoice.totalIncVat = 100;
        invoice.paidAmount = 50;

        await recordApi.save(invoice);

        const partner = recordApi.getNew(
            appHeirarchy.partnersCollection.nodeKey(),
            "partner");
        
        partner.surname = "thedog";
        
        await recordApi.save(partner);

        const partnerInvoice = recordApi.getNewChild(
            partner.key(),
            "invoices",
            "invoice"
        );

        partnerInvoice.totalIncVat = 100;
        partnerInvoice.paidAmount = 50;

        await recordApi.save(partnerInvoice);

        const indexKey = appHeirarchy.outstandingInvoicesIndex.nodeKey();
        await recordApi._storeHandle.deleteFile(
            getIndexedDataKey_fromIndexKey(indexKey)
        );

        await indexApi.buildIndex(indexKey);
        const indexItems = await indexApi.listItems(indexKey);

        expect(indexItems.length).toBe(2);
        expect(indexItems[0].key).toBe(invoice.key());
        expect(indexItems[1].key).toBe(partnerInvoice.key());

    });

});

describe("buildIndex > TopLevelCollection", () => {

    it("should index a record when it is a nested decendant of the collection node", async() => {
        const {recordApi, indexApi, appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndIndexes
        );

        const customer = recordApi.getNew(
            appHeirarchy.customersCollection.nodeKey(),
            "customer");
        
        customer.surname = "thedog";
        
        await recordApi.save(customer);

        const invoice = recordApi.getNewChild(
            customer.key(),
            "invoices",
            "invoice"
        );

        invoice.totalIncVat = 100;
        invoice.paidAmount = 50;

        await recordApi.save(invoice);

        const indexKey = appHeirarchy.customerInvoicesIndex.nodeKey();
        await recordApi._storeHandle.deleteFile(
            getIndexedDataKey_fromIndexKey(indexKey)
        );

        await indexApi.buildIndex(indexKey);
        const indexItems = await indexApi.listItems(indexKey);

        expect(indexItems.length).toBe(1);
        expect(indexItems[0].key).toBe(invoice.key());

    });

    it("should not index a record when it is not decendant", async() => {
        const {recordApi, indexApi, appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndIndexes
        );

        const partner = recordApi.getNew(
            appHeirarchy.partnersCollection.nodeKey(),
            "partner");
        
        partner.surname = "thedog";
        
        await recordApi.save(partner);

        const invoice = recordApi.getNewChild(
            partner.key(),
            "invoices",
            "invoice"
        );

        invoice.totalIncVat = 100;
        invoice.paidAmount = 50;

        await recordApi.save(invoice);

        const indexKey = appHeirarchy.customerInvoicesIndex.nodeKey();
        await recordApi._storeHandle.deleteFile(
            getIndexedDataKey_fromIndexKey(indexKey)
        );

        await indexApi.buildIndex(indexKey);
        const indexItems = await indexApi.listItems(indexKey);

        expect(indexItems.length).toBe(0);

    });

});

describe("buildIndex > nested collection", () => {

    it("should build a single record into index", async () => {

        const {recordApi, indexApi, appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndIndexes
        );

        const customer = recordApi.getNew(
            appHeirarchy.customersCollection.nodeKey(),
            "customer");
        
        customer.surname = "thedog";
        
        await recordApi.save(customer);

        const invoice = recordApi.getNewChild(
            customer.key(),
            "invoices",
            "invoice"
        );

        invoice.totalIncVat = 100;
        invoice.paidAmount = 50;

        await recordApi.save(invoice);

        const indexKey = joinKey(customer.key(), "invoices", "default");
        await recordApi._storeHandle.deleteFile(
            getIndexedDataKey_fromIndexKey(indexKey)
        );

        await indexApi.buildIndex(
            appHeirarchy.invoicesCollection.indexes[0].nodeKey());
        const indexItems = await indexApi.listItems(indexKey);

        expect(indexItems.length).toBe(1);
        expect(indexItems[0].key).toBe(invoice.key());

    });

    it("should build multiple records, from different parents into index", async () => {

        const {recordApi, indexApi, appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndIndexes
        );

        const customer = recordApi.getNew(
            appHeirarchy.customersCollection.nodeKey(),
            "customer");
        
        customer.surname = "thedog";
        
        await recordApi.save(customer);

        const invoice = recordApi.getNewChild(
            customer.key(),
            "invoices",
            "invoice"
        );

        invoice.totalIncVat = 100;
        invoice.paidAmount = 50;

        await recordApi.save(invoice);

        const customer2 = recordApi.getNew(
            appHeirarchy.customersCollection.nodeKey(),
            "customer");
        
        customer2.surname = "thedog";
        
        await recordApi.save(customer2);

        const invoice2 = recordApi.getNewChild(
            customer2.key(),
            "invoices",
            "invoice"
        );

        invoice2.totalIncVat = 100;
        invoice2.paidAmount = 50;

        await recordApi.save(invoice2);

        const indexKey = joinKey(customer.key(), "invoices", "default");
        await recordApi._storeHandle.deleteFile(
            getIndexedDataKey_fromIndexKey(indexKey)
        );

        await indexApi.buildIndex(
            appHeirarchy.invoicesCollection.indexes[0].nodeKey());
        const indexItems = await indexApi.listItems(indexKey);

        expect(indexItems.length).toBe(2);
        expect(some(indexItems, i => i.key === invoice.key())).toBeTruthy();
        expect(some(indexItems, i => i.key === invoice2.key())).toBeTruthy();

    });

});

describe("buildIndex > reverse reference index", () => {

    it("should build a single record into index", async () => {
        const {recordApi, indexApi, appHeirarchy} = 
            await setupAppheirarchy(
                basicAppHeirarchyCreator_WithFields_AndIndexes
            );

        const partner1 = recordApi.getNew("/partners", "partner");
        partner1.businessName = "ACME inc";
        await recordApi.save(partner1);

        const customer = recordApi.getNew("/customers", "customer");
        customer.surname = "Ledog";
        customer.partner = {
            key: partner1.key(), value: partner1.businessName
        };
        customer.isalive = false;

        await recordApi.save(customer);

        const indexKey = joinKey(partner1.key(), "partnerCustomers");
        await recordApi._storeHandle.deleteFile(
            getIndexedDataKey_fromIndexKey(indexKey)
        );

        await indexApi.buildIndex(
            appHeirarchy.partnerCustomersReverseIndex.nodeKey());
        const indexItems = await indexApi.listItems(indexKey);

        expect(indexItems.length).toBe(2);
        expect(some(indexItems, i => i.key === customer.key())).toBeTruthy();
    });

});