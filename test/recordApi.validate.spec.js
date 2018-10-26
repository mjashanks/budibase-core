import {setupAppheirarchy, stubEventHandler,
    basicAppHeirarchyCreator_WithFields, getNewFieldAndAdd,
    heirarchyFactory, withFields} from "./specHelpers";
import {find} from "lodash";
import {addHours} from "date-fns";
import {onSaveInvalid} from "../src/recordApi/events"

describe("recordApi > validate", () => {

    it("should return errors when any fields do not parse", async () => {

        const {recordApi} = await setupAppheirarchy(basicAppHeirarchyCreator_WithFields);
        const record = recordApi.getNew("/customers", "customer");

        record.surname = "Ledog";
        record.isalive = "hello";
        record.age = "nine";
        record.createddate = "blah";

        const validationResult = recordApi.validate(record);
        
        expect(validationResult.isValid).toBe(false); 
        expect(validationResult.errors.length).toBe(3);
    });

    it("should return errors when mandatory field is empty", async () => {
        const withValidationRule = (heirarchy, templateApi) => {
            templateApi.addRecordValidationRule(heirarchy.customerRecord)
            (templateApi.commonRecordValidationRules.fieldNotEmpty("surname"));
        };

        const heirarchyCreator = heirarchyFactory(withFields, withValidationRule);
        const {recordApi} = 
            await setupAppheirarchy(heirarchyCreator);

        
        const record = recordApi.getNew("/customers", "customer");
    
        record.surname = "";

        const validationResult = recordApi.validate(record);

        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors.length).toBe(1);
    });

    it("should return error when string field is beyond maxLength", async () => {
        const withFieldWithMaxLength = (heirarchy, templateApi) => {
            const surname = find(heirarchy.customerRecord.fields, f => f.name === "surname");
            surname.typeOptions.maxLength = 5;
        };

        const heirarchyCreator = heirarchyFactory(withFields, withFieldWithMaxLength);
        const {recordApi, appHeirarchy} = 
            await setupAppheirarchy(heirarchyCreator);

        
        const record = recordApi.getNew("/customers", "customer");
        record.surname = "more than 5 chars";
        
        const validationResult = recordApi.validate(record);
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors.length).toBe(1);
    });

    it("should return error when number field is > maxValue", async () => {
        const withFieldWithMaxLength = (heirarchy, templateApi) => {
            const age = find(heirarchy.customerRecord.fields, f => f.name === "age");
            age.typeOptions.maxValue = 10;
            age.typeOptions.minValue = 5
        };

        const heirarchyCreator = heirarchyFactory(withFields, withFieldWithMaxLength);
        const {recordApi, appHeirarchy} = 
            await setupAppheirarchy(heirarchyCreator);

        
        const tooOldRecord = recordApi.getNew("/customers", "customer");
        tooOldRecord.age = 11
        
        const tooOldResult = recordApi.validate(tooOldRecord);
        expect(tooOldResult.isValid).toBe(false);
        expect(tooOldResult.errors.length).toBe(1);

    });

    it("should return error when number field is < minValue", async () => {
        const withFieldWithMaxLength = (heirarchy, templateApi) => {
            const age = find(heirarchy.customerRecord.fields, f => f.name === "age");
            age.typeOptions.minValue = 5
        };

        const heirarchyCreator = heirarchyFactory(withFields, withFieldWithMaxLength);
        const {recordApi, appHeirarchy} = 
            await setupAppheirarchy(heirarchyCreator);

        const tooYoungRecord = recordApi.getNew("/customers", "customer");
        tooYoungRecord.age = 3
        
        const tooYoungResult = recordApi.validate(tooYoungRecord);
        expect(tooYoungResult.isValid).toBe(false);
        expect(tooYoungResult.errors.length).toBe(1);
    });

    it("should return error when number has too many decimal places", async () => {
        const withFieldWithMaxLength = (heirarchy, templateApi) => {
            const age = find(heirarchy.customerRecord.fields, f => f.name === "age");
            age.typeOptions.decimalPlaces = 2;
        };

        const heirarchyCreator = heirarchyFactory(withFields, withFieldWithMaxLength);
        const {recordApi, appHeirarchy} = 
            await setupAppheirarchy(heirarchyCreator);

        const record = recordApi.getNew("/customers", "customer");
        record.age = 3.123
        
        const validationResult = recordApi.validate(record);
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors.length).toBe(1);
    });

    it("should return error when datetime field is > maxValue", async () => {
        const withFieldWithMaxLength = (heirarchy, templateApi) => {
            const createddate = find(heirarchy.customerRecord.fields, f => f.name === "createddate");
            createddate.typeOptions.maxValue = new Date();
        };

        const heirarchyCreator = heirarchyFactory(withFields, withFieldWithMaxLength);
        const {recordApi, appHeirarchy} = 
            await setupAppheirarchy(heirarchyCreator);

        
        const record = recordApi.getNew("/customers", "customer");
        record.createddate = addHours(new Date(), 1);
        
        const result = recordApi.validate(record);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBe(1);

    });

    it("should return error when number field is < minValue", async () => {
        const withFieldWithMaxLength = (heirarchy, templateApi) => {
            const createddate = find(heirarchy.customerRecord.fields, f => f.name === "createddate");
            createddate.typeOptions.minValue = addHours(new Date(), 1);
        };

        const heirarchyCreator = heirarchyFactory(withFields, withFieldWithMaxLength);
        const {recordApi, appHeirarchy} = 
            await setupAppheirarchy(heirarchyCreator);

        
        const record = recordApi.getNew("/customers", "customer");
        record.createddate = addHours(new Date(), 1);
        
        const result = recordApi.validate(record);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBe(1);
    });

    it("should return error when string IS NOT one of declared values, and only declared values are allowed", async () => {
        const withFieldWithMaxLength = (heirarchy, templateApi) => {
            const surname = find(heirarchy.customerRecord.fields, f => f.name === "surname");
            surname.typeOptions.allowDeclaredValuesOnly = true
            surname.typeOptions.values = ["thedog"];
        };

        const heirarchyCreator = heirarchyFactory(withFields, withFieldWithMaxLength);
        const {recordApi, appHeirarchy} = 
            await setupAppheirarchy(heirarchyCreator);

        
        const record = recordApi.getNew("/customers", "customer");
        record.surname = "zeecat";
        
        const result = recordApi.validate(record);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBe(1);
    });

    it("should not return error when string IS one of declared values, and only declared values are allowed", async () => {
        const withFieldWithMaxLength = (heirarchy, templateApi) => {
            const surname = find(heirarchy.customerRecord.fields, f => f.name === "surname");
            surname.typeOptions.allowDeclaredValuesOnly = true
            surname.typeOptions.values = ["thedog"];
        };

        const heirarchyCreator = heirarchyFactory(withFields, withFieldWithMaxLength);
        const {recordApi, appHeirarchy} = 
            await setupAppheirarchy(heirarchyCreator);

        
        const record = recordApi.getNew("/customers", "customer");
        record.surname = "thedog";
        
        const result = recordApi.validate(record);
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    it("should not return error when string IS NOT one of declared values, but any values are allowed", async () => {
        const withFieldWithMaxLength = (heirarchy, templateApi) => {
            const surname = find(heirarchy.customerRecord.fields, f => f.name === "surname");
            surname.typeOptions.allowDeclaredValuesOnly = false
            surname.typeOptions.values = ["thedog"];
        };

        const heirarchyCreator = heirarchyFactory(withFields, withFieldWithMaxLength);
        const {recordApi, appHeirarchy} = 
            await setupAppheirarchy(heirarchyCreator);

        
        const record = recordApi.getNew("/customers", "customer");
        record.surname = "zeecat";
        
        const result = recordApi.validate(record);
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    it("should publish invalid events", async () => {
        const withValidationRule = (heirarchy, templateApi) => {
            templateApi.addRecordValidationRule(heirarchy.customerRecord)
            (templateApi.commonRecordValidationRules.fieldNotEmpty("surname"));
        };

        const heirarchyCreator = heirarchyFactory(withFields, withValidationRule);

        const {recordApi, subscribe} = await setupAppheirarchy(heirarchyCreator);
        const handler = stubEventHandler();
        subscribe(onSaveInvalid, handler.handle);

        const record = recordApi.getNew("/customers", "customer");
        record.surname = "";

        try{
            await recordApi.save(record);
        } catch(e)
        {}

        const onInvalid = handler.getEvents(onSaveInvalid);
        expect(onInvalid.length).toBe(1);
        expect(onInvalid[0].context.record).toBeDefined();
        expect(onInvalid[0].context.record.key()).toBe(record.key());
        expect(onInvalid[0].context.validationResult).toBeDefined();
    });

});