import {setupAppheirarchy,
    basicAppHeirarchyCreator_WithFields_AndIndexes} from "./specHelpers";

describe("indexApi > listItems", () => {

    it("should pull items from one shard when only startRange and endRange params are equal", async () => {

        const {recordApi,
        indexApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        
        const record1 = recordApi.getNew("/customers", "customer");
        record1.surname = "Ledog";
        await recordApi.save(record1);

        const record2 = recordApi.getNew("/customers", "customer");
        record2.surname = "Zeecat";
        await recordApi.save(record2);

        const items_L_shard = await indexApi.listItems(
            "/customers/customersBySurname", 
            {surname:"L"},
            {surname:"L"}
        );
        expect(items_L_shard.length).toBe(1);
        expect(items_L_shard[0].key).toBe(record1.key());

        const items_Z_shard = await indexApi.listItems(
            "/customers/customersBySurname", 
            {surname:"Z"},
            {surname:"Z"}
        );
        expect(items_Z_shard.length).toBe(1);
        expect(items_Z_shard[0].key).toBe(record2.key());

    });

    it("should pull items from one shard when shard is within startRange and endRange params", async () => {

        const {recordApi,
        indexApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        
        const record1 = recordApi.getNew("/customers", "customer");
        record1.surname = "Ledog";
        await recordApi.save(record1);

        const record2 = recordApi.getNew("/customers", "customer");
        record2.surname = "Zeecat";
        await recordApi.save(record2);

        const items_L_shard = await indexApi.listItems(
            "/customers/customersBySurname", 
            {surname:"K"},
            {surname:"M"}
        );
        expect(items_L_shard.length).toBe(1);
        expect(items_L_shard[0].key).toBe(record1.key());

    });

    it("should pull items from multiple shards are withing startRange and endRange params", async () => {

        const {recordApi,
        indexApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields_AndIndexes);
        
        const record1 = recordApi.getNew("/customers", "customer");
        record1.surname = "Ledog";
        await recordApi.save(record1);

        const record2 = recordApi.getNew("/customers", "customer");
        record2.surname = "Zeecat";
        await recordApi.save(record2);

        const items_L_shard = await indexApi.listItems(
            "/customers/customersBySurname", 
            {surname:"K"},
            {surname:"Z"}
        );
        expect(items_L_shard.length).toBe(2);
        expect(items_L_shard[0].key).toBe(record1.key());

    });

});