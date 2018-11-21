import {setupAppheirarchy,
    basicAppHeirarchyCreator_WithFields, 
    basicAppHeirarchyCreator_WithFields_AndIndexes} from "./specHelpers";
import {joinKey} from "../src/common";
import {some, isArray} from "lodash";

describe("recordApi > create > reindex", () => {

    it("should add to default index, when record created", async () => {

        const {recordApi,
        collectionApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        const record = recordApi.getNew("/customers", "customer");

        record.surname = "Ledog";
        record.isalive = true;
        record.age = 9;
        record.createddate = new Date();

        await recordApi.save(record);

        const items = await collectionApi.listRecords("/customers/default");

        expect(items.length).toBe(1);
        expect(items[0].surname).toBe("Ledog");
        expect(items[0].key).toBeDefined();
        expect(items[0].key).toEqual(record.key());
    });

    it("should add to index with filter, when record created and passes filter", async () => {

        const {recordApi,
        collectionApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        const record = recordApi.getNew("/customers", "customer");

        record.surname = "Ledog";
        record.isalive = false;
        record.age = 9;
        record.createddate = new Date();

        await recordApi.save(record);

        const items = await collectionApi.listRecords("/customers/deceased");

        expect(items.length).toBe(1);
        expect(items[0].surname).toBe("Ledog");
        expect(items[0].key).toBeDefined();
        expect(items[0].key).toEqual(record.key());
    });

    it("should not add to index with filter, when record created and fails filter", async () => {

        const {recordApi,
        collectionApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        const record = recordApi.getNew("/customers", "customer");

        record.surname = "Ledog";
        record.isalive = true;
        record.age = 9;
        record.createddate = new Date();

        await recordApi.save(record);

        const items = await collectionApi.listRecords("/customers/deceased");

        expect(items.length).toBe(0);
    });


    it("should be able to add to and list subcollection, after save (i.e. save initialiieses collection)", async () => {
        const {recordApi, collectionApi} = 
            await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        
        const customer = recordApi.getNew("/customers", "customer");
        await recordApi.save(customer);
        
        const invoicesCollectionKey = joinKey(customer.key(), "invoices");
        const invoice = recordApi.getNew(invoicesCollectionKey, "invoice");
        invoice.totalIncVat = 10.5;
        invoice.createdDate = new Date();
        await recordApi.save(invoice);

        const invoices = await collectionApi.listRecords(
                            joinKey(invoicesCollectionKey, "default"));
        
        expect(isArray(invoices)).toBeTruthy();
        expect(invoices.length).toBe(1);
        expect(invoices[0].totalIncVat).toBe("10.5");

    });

    it("should add to global index, when required", async () => {
        const {recordApi, indexApi} = 
            await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);

        const customer = recordApi.getNew("/customers", "customer");
        customer.surname = "Ledog";
        customer.age = 9;
        customer.isalive = true,
        customer.createdDate = new Date();
        await recordApi.save(customer);

        const customers = await indexApi.listItems("/customersReference");

        expect(isArray(customers)).toBeTruthy();
        expect(customers.length).toBe(1);
        expect(customers[0].name).toBe("Ledog");
    });

    it("should add to reverse reference index, when required", async () => {
        const {recordApi, indexApi} = 
            await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);

        const referredByCustomer = recordApi.getNew("/customers", "customer");
        referredByCustomer.surname = "Ledog";
        referredByCustomer.age = 9;
        referredByCustomer.isalive = true,
        referredByCustomer.createdDate = new Date();
        await recordApi.save(referredByCustomer);

        const referredCustomer = recordApi.getNew("/customers", "customer");
        referredCustomer.surname = "Zeecat";
        referredCustomer.age = 9;
        referredCustomer.isalive = true,
        referredCustomer.createdDate = new Date();
        referredCustomer.referredBy = {
            key:referredByCustomer.key(), 
            value:referredByCustomer.surname};
        await recordApi.save(referredCustomer);

        const customersReferredTo = await indexApi.listItems(
            joinKey(referredByCustomer.key(), "referredToCustomers")
        );

        expect(isArray(customersReferredTo)).toBeTruthy();
        expect(customersReferredTo.length).toBe(1);
        expect(customersReferredTo[0].surname).toBe("Zeecat");
    });

});

describe("recordApi > delete > reindex", () => {

    it("should remove from default index", async () => {
        const {recordApi,
            collectionApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        const record = recordApi.getNew("/customers", "customer");

        record.surname = "Ledog";
        record.isalive = true;
        record.age = 9;
        record.createddate = new Date();

        await recordApi.save(record);
        await recordApi.delete(record.key());

        const itemsAfterDelete= await collectionApi.listRecords("/customers/default");
        expect(itemsAfterDelete.length).toBe(0);
    })

    it("should remove from all indexes", async () => {
        const {recordApi,
            collectionApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        const record = recordApi.getNew("/customers", "customer");

        record.surname = "Ledog";
        record.isalive = false;
        record.age = 9;
        record.createddate = new Date();

        await recordApi.save(record);

        await recordApi.delete(record.key());

        const itemsAfterDelete= await collectionApi.listRecords("/customers/default");
        expect(itemsAfterDelete.length).toBe(0);

        const deceasedItemsAfterDelete=
            await collectionApi.listRecords("/customers/deceased");
        expect(deceasedItemsAfterDelete.length).toBe(0);
    });

    it("should only remove relevant record from all indexes", async () => {
        const {recordApi,
            collectionApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        const record = recordApi.getNew("/customers", "customer");

        record.surname = "Ledog";
        record.isalive = false;
        record.age = 9;
        record.createddate = new Date();

        await recordApi.save(record);

        const otherRecord = recordApi.getNew("/customers", "customer");
        otherRecord.surname = "Zeecat";
        otherRecord.isalive = false;
        otherRecord.age = 12;
        record.createddate = new Date();

        await recordApi.save(otherRecord);

        await recordApi.delete(record.key());

        const itemsAfterDelete= await collectionApi.listRecords("/customers/default");
        expect(itemsAfterDelete.length).toBe(1);
        expect(itemsAfterDelete[0].surname).toBe("Zeecat");

        const deceasedItemsAfterDelete=
            await collectionApi.listRecords("/customers/deceased");
        expect(deceasedItemsAfterDelete.length).toBe(1);
        expect(deceasedItemsAfterDelete[0].surname).toBe("Zeecat");
    });

    it("should remove from global index", async () => {
        const {recordApi, indexApi} = 
            await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);

        const customer = recordApi.getNew("/customers", "customer");
        customer.surname = "Ledog";
        customer.age = 9;
        customer.isalive = true,
        customer.createdDate = new Date();
        await recordApi.save(customer);
        await recordApi.delete(customer.key());
        const customers = await indexApi.listItems("/customersReference");

        expect(isArray(customers)).toBeTruthy();
        expect(customers.length).toBe(0);
    });
});

describe("recordApi > update > reindex", () => {

    it("should update values in indexes", async () => {
        const {recordApi,
            collectionApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        const record = recordApi.getNew("/customers", "customer");

        record.surname = "Ledog";
        record.isalive = false;
        record.age = 9;
        record.createddate = new Date();

        await recordApi.save(record);

        const loadedRecord = await recordApi.load(record.key());
        loadedRecord.surname = "Zeedog";
        await recordApi.save(loadedRecord);

        const itemsDefault = await collectionApi.listRecords("/customers/default");
        expect(itemsDefault[0].surname).toBe("Zeedog");
        expect(itemsDefault.length).toBe(1);

    });

    it("should only update values of relevant item", async () => {
        const {recordApi,
            collectionApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        const record = recordApi.getNew("/customers", "customer");

        record.surname = "Ledog";
        record.isalive = false;
        record.age = 9;
        record.createddate = new Date();

        await recordApi.save(record);

        const otherRecord = recordApi.getNew("/customers", "customer");
        otherRecord.surname = "Zeecat";
        otherRecord.isalive = false;
        otherRecord.age = 12;
        record.createddate = new Date();

        await recordApi.save(otherRecord);

        const loadedRecord = await recordApi.load(record.key());
        loadedRecord.surname = "Zeedog";
        await recordApi.save(loadedRecord);

        const items = await collectionApi.listRecords("/customers/default");

        const hasItemWithSurname = sn => 
            some(items, i => i.surname === sn);

        expect(hasItemWithSurname("Zeedog")).toEqual(true);
        expect(hasItemWithSurname("Ledog")).toEqual(false);
        expect(hasItemWithSurname("Zeecat")).toEqual(true);
        expect(items.length).toBe(2);
    });

    it("should update global index", async () => {
        const {recordApi, indexApi} = 
            await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);

        const customer = recordApi.getNew("/customers", "customer");
        customer.surname = "Ledog";
        customer.age = 9;
        customer.isalive = true,
        customer.createdDate = new Date();
        await recordApi.save(customer);

        const loadedCustomer = await recordApi.load(customer.key());
        loadedCustomer.surname = "Zeecat";
        await recordApi.save(loadedCustomer);

        const customers = await indexApi.listItems("/customersReference");
        expect(isArray(customers)).toBeTruthy();
        expect(customers.length).toBe(1);
        expect(customers[0].name).toBe("Zeecat");
    });

});