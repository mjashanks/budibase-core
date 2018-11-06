import {setupAppheirarchy,
    basicAppHeirarchyCreator_WithFields} from "./specHelpers";
import {keys, filter} from "lodash/fp";
import {$} from "../src/common";

describe("recordApi > delete", () => {
    
    it("should remove every key in record's path", async () => {
        const {recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const record = recordApi.getNew("/customers", "customer");
        record.surname = "Ledog";
    
        await recordApi.save(record);
        await recordApi.delete(record.key());

        const remainingKeys = $(recordApi._storeHandle.data, [
            keys,
            filter(k => k.startsWith(record.key()))
        ]);
        
        expect(remainingKeys).toEqual([]);

    });


    it("should remove every key in record's path, when record has child records", async () => {
        const {recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const record = recordApi.getNew("/customers", "customer");
        record.surname = "Ledog";
    
        await recordApi.save(record);

        const invoice = recordApi.getNew(`${record.key()}/invoices`, "invoice");
        await recordApi.save(invoice);

        await recordApi.delete(record.key());

        const remainingKeys = $(recordApi._storeHandle.data, [
            keys,
            filter(k => k.startsWith(record.key()))
        ]);
        
        expect(remainingKeys).toEqual([]);

    });

})
