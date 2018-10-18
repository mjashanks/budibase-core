import {isDefined, join, fieldDefinitions, $} from "../src/common";
import {getApis} from "./specHelpers";
import {fieldErrors} from "../src/templateApi/fields";

    const getRecordTemplate = templateApi => 
        $(templateApi.getNewRootLevel(), [
            templateApi.getNewRecordTemplate
        ]);

    const getValidField = templateApi => {
        const field = templateApi.getNewField("string");
        field.name = "forename";
        field.label = "";
        return field;
    };

    const testMemberIsNotSet = membername => async () => {
        const {templateApi} = await getApis();
        const record = getRecordTemplate(templateApi);
        const field = getValidField(templateApi);
        field[membername] = "";
        const errorsNotSet = templateApi.validateField(record, field);
        expect(errorsNotSet.length).toBe(1);
        expect(errorsNotSet[0] === `${membername} is not set`);
    };
    
    const testMemberIsNotDefined = membername => async () => {
        const {templateApi} = await getApis();
        const record = getRecordTemplate(templateApi);
        const field = getValidField(templateApi);

        delete field[membername];
        const errorsUndefined = templateApi.validateField(record, field);
        expect(errorsUndefined.length).toBe(1);
        expect(errorsUndefined[0] === `${membername} is undefined`);
    };

describe("validateField", () => {

    it("should return error when name is not set",
        testMemberIsNotSet("name"));

    it("should return error when name is not defined",
        testMemberIsNotDefined("name"));

    it("should return error when type is not set",
        testMemberIsNotSet("type"));

    it("should return error when type is not defined",
        testMemberIsNotDefined("type"));
    
    it("should return error when label is not defined",
        testMemberIsNotDefined("label"));
    
    it("should return error when getInitialValue is not defined",
        testMemberIsNotDefined("getInitialValue"));
    
    it("should return error when getInitialValue is not set",
        testMemberIsNotSet("getInitialValue"));

    it("should return error when getUndefinedValue is not defined",
        testMemberIsNotDefined("getUndefinedValue"));

    it("should return error when getUndefinedValue is not set",
        testMemberIsNotSet("getUndefinedValue"));
    
    it("should return no errors when valid field is supplied", async () => {
        const {templateApi} = await getApis();
        const record = getRecordTemplate(templateApi);
        const field = getValidField(templateApi);
        const errors = templateApi.validateField(record, field);
        expect(errors.length).toBe(0);
    });

    it("should return error when field with same name exists already", async () => {
        const {templateApi} = await getApis();
        const record = getRecordTemplate(templateApi);
        const field1 = getValidField(templateApi);
        field1.name = "surname";
        record.fields.push(field1);

        const field2 = getValidField(templateApi);
        field2.name = "surname";
        const errors = templateApi.validateField(record, field2);
        expect(errors.length).toBe(1);
        expect(errors[0]).toBe("name:'surname' already exists");
    });

    it("should return error when field is not one of allowed types", async () => {
        const {templateApi} = await getApis();
        const record = getRecordTemplate(templateApi);
        const field = getValidField(templateApi);
        field.type = "sometype";
        const errors = templateApi.validateField(record, field);
        expect(errors.length).toBe(1);
        expect(errors[0]).toBe("type:'sometype' is not recognised");
    });

});

describe("addField", () => {

    it("should throw exception when field is invalid", async () => {
        const {templateApi} = await getApis();
        const record = getRecordTemplate(templateApi);
        const field = getValidField(templateApi);
        field.name = "";
        expect(() => templateApi.addField(record, field))
        .toThrow(new RegExp('^' + fieldErrors.AddFieldValidationFailed, 'i'));
    });

    it("should add field when field is invalid", async () => {
        const {templateApi} = await getApis();
        const record = getRecordTemplate(templateApi);
        const field = getValidField(templateApi);
        templateApi.addField(record, field);
        expect(record.fields.length).toBe(1);
        expect(record.fields[0]).toBe(field);
    });

});
