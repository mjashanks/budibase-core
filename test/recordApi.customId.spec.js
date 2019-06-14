import {setupAppheirarchy, basicAppHeirarchyCreator_WithFields, 
    getNewFieldAndAdd, stubEventHandler} from "./specHelpers";
import { iterateIndex } from "../src/indexing/read";

describe("get customId",  () => {
    it("should generate an id with given value", async () => {

        const {recordApi, appHeirarchy} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const customId = recordApi.customId("customer", "my_custom_id");
        expect(customId).toBe(`${appHeirarchy.customerRecord.nodeId}-my_custom_id`);

    });

    it("should throw error when nodeName does not exist", async () => {

        const {recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        expect(() => recordApi.customId("not a node", "my_ custom_id")).toThrow();
    
    });

});

describe("set customId", () => {
    it("should generate custom id and set on given record", async () => {
        const {recordApi, appHeirarchy} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const customer = recordApi.getNew("/customers", "customer");

        recordApi.setCustomId(customer, "my_custom_id");
        expect(customer.id).toBe(`${appHeirarchy.customerRecord.nodeId}-my_custom_id`)
        expect(customer.key).toBe(`/customers/${appHeirarchy.customerRecord.nodeId}-my_custom_id`)
    })
})


