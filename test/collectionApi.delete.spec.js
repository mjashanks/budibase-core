import {setupAppheirarchy, basicAppHeirarchyCreator_WithFields} from "./specHelpers";
import {$, splitKey} from "../src/common";
import {keys, filter} from "lodash/fp";
describe("collectionApi > delete", () => {

    it("should remove every key in collection's path", async () => {
        const {recordApi, collectionApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const record1 = recordApi.getNew("/customers", "customer");
        record1.surname = "Ledog";
    
        await recordApi.save(record1);

        const record2 = recordApi.getNew("/customers", "customer");
        record2.surname = "Zeecat";
        
        await recordApi.save(record2);

        const childRecord = recordApi.getNew(`${record1.key()}/invoices`, "invoice");
        await recordApi.save(childRecord);

        await collectionApi.delete("/customers");

        const remainingKeys = $(recordApi._storeHandle.data, [
            keys,
            filter(k => splitKey(k)[0] === "customers")
        ]);
        
        expect(remainingKeys).toEqual([]);

    });

    it("should not delete anything that is not in its path", async () => {
        const {recordApi, collectionApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const customer = recordApi.getNew("/customers", "customer");
        customer.surname = "Ledog";
    
        await recordApi.save(customer);

        const partner = recordApi.getNew("/partners", "partner");
        await recordApi.save(partner);

        const allKeys = keys(recordApi._storeHandle.data);
        const customerKeys = $(allKeys, [
            filter(k => splitKey(k)[0] === "customers")
        ]);


        const expectedRemainingKeys = allKeys.length - customerKeys.length;

        await collectionApi.delete("/customers");

        const remainingKeys = keys(recordApi._storeHandle.data);
        expect(remainingKeys.length).toBe(expectedRemainingKeys);

    });

});