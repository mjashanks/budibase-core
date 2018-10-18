import {setupAppheirarchy, basicAppHeirarchyCreator_WithFields_AndViews} from "./specHelpers";
import { joinKey } from "../src/common";
import {some} from "lodash";

describe("buildIndex > Global View", () => {

    it("should index a record when record node is not decendant", async () => {
        const {recordApi, viewApi, appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndViews
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

        const viewKey = appHeirarchy.outstandingInvoicesView.nodeKey();
        await recordApi._storeHandle.deleteFile(
            viewKey
        );

        await viewApi.buildIndex(viewKey);
        const viewItems = await viewApi.listItems(viewKey);

        expect(viewItems.length).toBe(1);
        expect(viewItems[0].key).toBe(outstandingInvoice.key());
    });

    it("should index records from 2 seperate tree branches", async () => {
        const {recordApi, viewApi, appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndViews
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

        const viewKey = appHeirarchy.outstandingInvoicesView.nodeKey();
        await recordApi._storeHandle.deleteFile(
            viewKey
        );

        await viewApi.buildIndex(viewKey);
        const viewItems = await viewApi.listItems(viewKey);

        expect(viewItems.length).toBe(2);
        expect(viewItems[0].key).toBe(invoice.key());
        expect(viewItems[1].key).toBe(partnerInvoice.key());

    });

});

describe("buildIndex > TopLevelCollection", () => {

    it("should index a record when it is a nested decendant of the collection node", async() => {
        const {recordApi, viewApi, appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndViews
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

        const viewKey = appHeirarchy.customerInvoicesView.nodeKey();
        await recordApi._storeHandle.deleteFile(
            viewKey
        );

        await viewApi.buildIndex(viewKey);
        const viewItems = await viewApi.listItems(viewKey);

        expect(viewItems.length).toBe(1);
        expect(viewItems[0].key).toBe(invoice.key());

    });

    it("should not index a record when it is not decendant", async() => {
        const {recordApi, viewApi, appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndViews
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

        const viewKey = appHeirarchy.customerInvoicesView.nodeKey();
        await recordApi._storeHandle.deleteFile(
            viewKey
        );

        await viewApi.buildIndex(viewKey);
        const viewItems = await viewApi.listItems(viewKey);

        expect(viewItems.length).toBe(0);

    });

});

describe("buildIndex > nested collection", () => {

    it("should build a single record into index", async () => {

        const {recordApi, viewApi, appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndViews
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

        const viewKey = joinKey(customer.key(), "invoices", "default");
        await recordApi._storeHandle.deleteFile(
            viewKey
        );

        await viewApi.buildIndex(
            appHeirarchy.invoicesCollection.views[0].nodeKey());
        const viewItems = await viewApi.listItems(viewKey);

        expect(viewItems.length).toBe(1);
        expect(viewItems[0].key).toBe(invoice.key());

    });

    it("should build multiple records, from different parents into index", async () => {

        const {recordApi, viewApi, appHeirarchy} = await setupAppheirarchy(
            basicAppHeirarchyCreator_WithFields_AndViews
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

        const viewKey = joinKey(customer.key(), "invoices", "default");
        await recordApi._storeHandle.deleteFile(
            viewKey
        );

        await viewApi.buildIndex(
            appHeirarchy.invoicesCollection.views[0].nodeKey());
        const viewItems = await viewApi.listItems(viewKey);

        expect(viewItems.length).toBe(2);
        expect(some(viewItems, i => i.key === invoice.key())).toBeTruthy();
        expect(some(viewItems, i => i.key === invoice2.key())).toBeTruthy();

    });

});