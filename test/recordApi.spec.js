import {setupAppheirarchy, basicAppHeirarchyCreator,
    basicAppHeirarchyCreator_WithFields, getNewFieldAndAdd,
    stubEventHandler} from "./specHelpers";
import {isFunction} from "lodash";
import {onSaveComplete, onSaveBegin, 
    onRecordCreated, onRecordUpdated} from "../src/recordApi/events";

describe("recordApi > getNew", () => {

    it("should get object with generated id and key (full path)", async () => {
        const {recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator);
        const record = recordApi.getNew("/customers", "customer");

        expect(record.id).toBeDefined();
        expect(isFunction(record.id)).toBeTruthy();

        expect(record.key).toBeDefined();
        expect(isFunction(record.key)).toBeTruthy();
        expect(record.key()).toBe(`/customers/${record.id()}`);
    });

    it("should create object with all declared fields, using default values", async () => {
        const {recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);

        const newRecord = recordApi.getNew("/customers", "customer")

        expect(newRecord.surname).toBe(null);
        expect(newRecord.isalive).toBe(null);
        expect(newRecord.createddate).toBe(null);
        expect(newRecord.age).toBe(null);        
    });

    it("should create object with all declared fields, and use inital values", async () => {
        const {recordApi} = await setupAppheirarchy(templateApi => {
            const heirarchy = basicAppHeirarchyCreator(templateApi);
            const {root, customerRecord} = heirarchy;
            const newField = getNewFieldAndAdd(templateApi, customerRecord);
        
            newField("surname", "string", "hello");
            newField("isalive", "bool", "true");
            newField("age", "number", "999");
        
            return heirarchy;
        });

        const newRecord = recordApi.getNew("/customers", "customer")

        expect(newRecord.surname).toBe("hello");
        expect(newRecord.isalive).toBe(true);
        expect(newRecord.age).toBe(999);        
    });

    it("should add a function 'isNew' which always returns true", async () => {
        const {recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const record = recordApi.getNew("/customers", "customer");

        expect(record.isNew).toBeDefined();
        expect(isFunction(record.isNew)).toBeTruthy();
        expect(record.isNew()).toBeTruthy();
    });

    it("should add a function 'type' returns type", async () => {
        const {recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const record = recordApi.getNew("/customers", "customer");

        expect(record.type).toBeDefined();
        expect(isFunction(record.type)).toBeTruthy();
        expect(record.type()).toBe("customer");
    });
});

describe('recordApi > save then load', () => {
    
    it('should save all field values on create new record', async () => {
        const {recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const record = recordApi.getNew("/customers", "customer");

        record.surname = "Ledog";
        record.isalive = true;
        record.age = 9;
        record.createddate = new Date();

        await recordApi.save(record);

        const saved = await recordApi.load(record.key());

        expect(saved.surname).toBe(record.surname);
        expect(saved.isalive).toBe(record.isalive);
        expect(saved.age).toBe(record.age);
        expect(saved.createddate).toEqual(record.createddate);

    });

    it('should create values for fields when undefined', async () => {
        const {recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const record = recordApi.getNew("/customers", "customer");

        record.age = 9;
        record.createddate = new Date();

        await recordApi.save(record);

        const saved = await recordApi.load(record.key());

        expect(saved.surname).toBe(null);
        expect(saved.isalive).toBe(null);
        expect(saved.age).toBe(record.age);
        expect(saved.createddate).toEqual(record.createddate);

    });

    it('loaded record isNew() always return false', async () => {
        const {recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const record = recordApi.getNew("/customers", "customer");

        record.age = 9;
        record.createddate = new Date();

        await recordApi.save(record);

        const saved = await recordApi.load(record.key());

        expect(saved.isNew).toBeDefined();
        expect(saved.isNew()).toBe(false);
    });

    it('loaded record id() and key() should work', async () => {
        const {recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const record = recordApi.getNew("/customers", "customer");

        record.age = 9;
        record.createddate = new Date();

        await recordApi.save(record);

        const saved = await recordApi.load(record.key());

        expect(saved.id).toBeDefined();
        expect(saved.id()).toBe(record.id());

        expect(saved.key).toBeDefined();
        expect(saved.key()).toBe(saved.key());
    });

    
    it('loaded record type() should be a function', async () => {
        const {recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const record = recordApi.getNew("/customers", "customer");

        record.age = 9;
        record.createddate = new Date();

        await recordApi.save(record);

        const saved = await recordApi.load(record.key());

        expect(isFunction(saved.type)).toBeTruthy()
        expect(saved.type()).toBe("customer");
    });

    it('update existing should update field', async () => {
        const {recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const record = recordApi.getNew("/customers", "customer");

        record.surname = "Ledog";
        record.isalive = true;
        record.age = 9;
        record.createddate = new Date();

        await recordApi.save(record);

        const saved = await recordApi.load(record.key());

        saved.surname = "Zeedog";
        await recordApi.save(saved);
        const savedAgain = await recordApi.load(saved.key());
        expect(savedAgain.surname).toBe(saved.surname); 
    });
});

describe("save", () => {

    it("IsNew() should return false after save", async () => {
        const {recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const record = recordApi.getNew("/customers", "customer");
        record.surname = "Ledog";

        const savedRecord = await recordApi.save(record);
        expect(savedRecord.isNew()).toBe(false);
    });

    it("should publish onbegin and oncomplete events", async () => {
        const {recordApi, subscribe} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const handler = stubEventHandler();
        subscribe(onSaveBegin, handler.handle);
        subscribe(onSaveComplete, handler.handle);

        const record = recordApi.getNew("/customers", "customer");
        record.surname = "Ledog";

        await recordApi.save(record);

        const onBegin = handler.getEvents(onSaveBegin);
        const onComplete = handler.getEvents(onSaveComplete);
        expect(onBegin.length).toBe(1);
        expect(onComplete.length).toBe(1);
        expect(onBegin[0].context.record).toBeDefined();
        expect(onBegin[0].context.record.key()).toBe(record.key());
        expect(onComplete[0].context.record).toBeDefined();
        expect(onComplete[0].context.record.key()).toBe(record.key());

    });

    it("should publish create on create and update on update", async () => {
        const {recordApi, subscribe} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const handler = stubEventHandler();
        subscribe(onRecordCreated, handler.handle);
        subscribe(onRecordUpdated, handler.handle);

        const record = recordApi.getNew("/customers", "customer");
        record.surname = "Ledog";

        const savedRecord =await recordApi.save(record);
        const onCreate = handler.getEvents(onRecordCreated);
        expect(onCreate.length).toBe(1);
        expect(onCreate[0].context.record).toBeDefined();
        expect(onCreate[0].context.record.key()).toBe(record.key());

        savedRecord.surname = "Zeecat";
        await recordApi.save(savedRecord);

        const onUpdate = handler.getEvents(onRecordUpdated);
        expect(onUpdate.length).toBe(1);
        expect(onUpdate[0].context.old).toBeDefined();
        expect(onUpdate[0].context.old.key()).toBe(record.key());
        expect(onUpdate[0].context.old.surname).toBe("Ledog");
        expect(onUpdate[0].context.new).toBeDefined();
        expect(onUpdate[0].context.new.key()).toBe(record.key());
        expect(onUpdate[0].context.new.surname).toBe("Zeecat");

    });
})
