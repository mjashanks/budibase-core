import {validateAll} from "../src/templateApi/validate";
import createNodes from "../src/templateApi/createNodes";
import {some} from "lodash";
import {getNewField, addField} from "../src/templateApi/fields";
import {getNewRecordValidationRule, commonRecordValidationRules,
    addRecordValidationRule} from "../src/templateApi/recordValidationRules";
import { findField } from "../src/templateApi/heirarchy";
import {findCollectionDefaultIndex} from "./specHelpers";

const createValidHeirarchy = () => {
    const root = createNodes.getNewRootLevel();

    const customerCollection = createNodes.getNewCollectionTemplate(root, "customers");

    const customersDefaultIndex = findCollectionDefaultIndex(customerCollection);
    const customersNoGroupaggregateGroup = createNodes.getNewAggregateGroupTemplate(customersDefaultIndex);
    customersNoGroupaggregateGroup.name = "Customers Summary";
    const allCustomersOwedFunctions = createNodes.getNewAggregateTemplate(customersNoGroupaggregateGroup);
    allCustomersOwedFunctions.aggregatedValue = "return record.owed";
    allCustomersOwedFunctions.name = "all customers owed amount";

    const partnersCollection = createNodes.getNewCollectionTemplate(root, "partners");

    const partnerRecord = createNodes.getNewRecordTemplate(partnersCollection);
    partnerRecord.name = "partner";
    const businessName = getNewField("string");
    businessName.name = "businessname";
    businessName.label = "bn";
    addField(partnerRecord,businessName);

    const customerRecord = createNodes.getNewRecordTemplate(customerCollection);
    customerRecord.name = "customer";
    const surnameField = getNewField("string");
    surnameField.name = "surname";
    surnameField.label = "surname";
    const isaliveField = getNewField("bool");
    isaliveField.name = "isalive";
    const createddateField = getNewField("datetime");
    createddateField.name = "createddate";
    const ageField = getNewField("number");
    ageField.name = "age";
    const partnerField = getNewField("reference");
    partnerField.name = "partner";
    partnerField.typeOptions.indexNodeKey = "l";
    partnerField.typeOptions.reverseIndexNodeKeys = ["l"];
    partnerField.typeOptions.displayValue = "l";
    const otherNamesField = getNewField("array<string>");
    otherNamesField.name = "othernames";
    addField(customerRecord, surnameField);
    addField(customerRecord, isaliveField);
    addField(customerRecord, createddateField);
    addField(customerRecord, ageField);
    addField(customerRecord, partnerField);
    addField(customerRecord, otherNamesField);
    addRecordValidationRule(customerRecord)
            (commonRecordValidationRules.fieldNotEmpty("surname"));

    return {
        root, customerCollection, 
        customerRecord, customersDefaultIndex,
        customersNoGroupaggregateGroup,
        allCustomersOwedFunctions
    }
};

describe("heirarchy validation", () => {

    const expectInvalidField = (validationResult, fieldName, expectedNode, count = 1) => {
        expect(validationResult.length).toBe(count);
        expect(some(validationResult, r => r.field === fieldName && r.item === expectedNode)).toBe(true);
    }

    it("should return no errors when heirarchy is valid", () => {
        const heirarchy = createValidHeirarchy();
        const validationResult = validateAll(heirarchy.root);
        expect(validationResult).toEqual([]);
    });

    it("should return an error on name field, when name not set, on all nodes types", () => {
        let heirarchy = createValidHeirarchy();
        const expectInvalidName = (node) => expectInvalidField(validationResult, "name", node, 1);
        
        heirarchy = createValidHeirarchy();
        heirarchy.customerCollection.name = "";
        let validationResult = validateAll(heirarchy.root);
        expectInvalidName(heirarchy.customerCollection);
        heirarchy.customerCollection.name = "customers";

        heirarchy = createValidHeirarchy();
        heirarchy.customerRecord.name = "";
        validationResult = validateAll(heirarchy.root);
        expectInvalidName(heirarchy.customerRecord); 
        heirarchy.customerRecord.name = "customer";

    });

    it("record > should return an error on fields member if empty", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.customerRecord.fields = [];
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "fields", heirarchy.customerRecord); 
    });

    it("record > should return an error on unrecognised type", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.customerRecord.type = "notatype";
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "type", heirarchy.customerRecord); 
    });

    it("record > should return an error when validation rules do not have correct members", () => {
        let heirarchy = createValidHeirarchy();
        delete heirarchy.customerRecord.validationRules[0].expressionWhenValid;
        let validationResult  = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "validationRules", heirarchy.customerRecord); 

        heirarchy = createValidHeirarchy();
        delete heirarchy.customerRecord.validationRules[0].messageWhenInvalid;
        validationResult  = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "validationRules", heirarchy.customerRecord); 

    });

    it("collection > should return error when no children", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.customerCollection.children = [];
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "children", heirarchy.customerCollection);
    });

    it("collection > should return error when duplicate names", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.customerCollection.name = "partners"
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "name", heirarchy.customerCollection, 2);
    });

    it("index > should return error when index has no map", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.customersDefaultIndex.map = "";
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "map", heirarchy.customersDefaultIndex);
    });

    it("index > should return error when index map function does not compile", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.customersDefaultIndex.map = "invalid js!!";
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "map", heirarchy.customersDefaultIndex);
    });

    it("index > should return error when index filter function does not compile", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.customersDefaultIndex.filter = "invalid js!!";
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "filter", heirarchy.customersDefaultIndex);
    });

    it("index > should return error when index type is not one of allowed values", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.customersDefaultIndex.indexType = "";
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "indexType", heirarchy.customersDefaultIndex);

        heirarchy.customersDefaultIndex.indexType = "should not be allowed";
        const validationResult2 = validateAll(heirarchy.root);
        expectInvalidField(validationResult2, "indexType", heirarchy.customersDefaultIndex);
    });

    it("index > should return error when reference index's parent is not a record", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.customersDefaultIndex.indexType = "reference";
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "indexType", heirarchy.customersDefaultIndex);
    });

    it("field > should return error when a field is invalid", () => {
        const heirarchy = createValidHeirarchy();
        const invalidField =heirarchy.customerRecord.fields[0];
        invalidField.name = "";
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "name", invalidField);
    });

    it("aggregateGroup > should return error when name is not supplied", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.customersNoGroupaggregateGroup.name = "";
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "name", heirarchy.customersNoGroupaggregateGroup);
    });

    it("aggregate > should return error when name note set", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.allCustomersOwedFunctions.name = "";
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "name", heirarchy.allCustomersOwedFunctions);
    });

    it("aggregate > should return error when condition does not compile", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.customersNoGroupaggregateGroup.condition = "invalid condition";
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "condition", heirarchy.customersNoGroupaggregateGroup);
    });

    it("aggregate > should return error when aggregatedValue does not compile", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.allCustomersOwedFunctions.aggregatedValue = "invalid value";
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "aggregatedValue", heirarchy.allCustomersOwedFunctions);
    });

    it("aggregate > should be valid when valid condition and aggregatedValue supplied", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.allCustomersOwedFunctions.aggregatedValue = "return record.owed;";
        heirarchy.allCustomersOwedFunctions.condition = "record.owed > 0;";
        const validationResult = validateAll(heirarchy.root);
        expect(validationResult.length).toBe(0);
    });

    it("field.typeOptions > string > should return error when maxLength <= 0", () => {
        const heirarchy = createValidHeirarchy();
        const invalidField = findField(heirarchy.customerRecord, "surname");
        invalidField.typeOptions.maxLength = -1;
        let validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.maxLength", invalidField);

        invalidField.typeOptions.maxLength = 0;
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.maxLength", invalidField);

        invalidField.typeOptions.maxLength = 1;
        validationResult = validateAll(heirarchy.root);
        validationResult.length === 0;
    });

    it("field.typeOptions > string > should return error allowDeclaredValues only is not a bool", () => {
        const heirarchy = createValidHeirarchy();
        const invalidField = findField(heirarchy.customerRecord, "surname");
        invalidField.typeOptions.allowDeclaredValuesOnly = null;
        let validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.allowDeclaredValuesOnly", invalidField);

        invalidField.typeOptions.allowDeclaredValuesOnly = "";
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.allowDeclaredValuesOnly", invalidField);

    });

    it("field.typeOptions > string > should return error when values contains non-string", () => {
        const heirarchy = createValidHeirarchy();
        const invalidField = findField(heirarchy.customerRecord, "surname");
        invalidField.typeOptions.values = [1];
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.values", invalidField);
    });

    it("field.typeOptions > bool > should return error when allowNulls is not a bool", () => {
        const heirarchy = createValidHeirarchy();
        const invalidField = findField(heirarchy.customerRecord, "isalive");
        invalidField.typeOptions.allowNulls = "1";
        let validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.allowNulls", invalidField);

        invalidField.typeOptions.allowNulls = null;
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.allowNulls", invalidField);
    });

    it("field.typeOptions > datetime > should return error when maxValue is not a date", () => {
        const heirarchy = createValidHeirarchy();
        const invalidField = findField(heirarchy.customerRecord, "createddate");
        invalidField.typeOptions.maxValue = "1";
        let validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.maxValue", invalidField);

        invalidField.typeOptions.maxValue = null;
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.maxValue", invalidField);
    });

    it("field.typeOptions > datetime > should return error when minValue is not a date", () => {
        const heirarchy = createValidHeirarchy();
        const invalidField = findField(heirarchy.customerRecord, "createddate");
        invalidField.typeOptions.minValue = "1";
        let validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.minValue", invalidField);

        invalidField.typeOptions.minValue = null;
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.minValue", invalidField);
    });

    it("field.typeOptions > number > should return error when minValue is not an integer", () => {
        const heirarchy = createValidHeirarchy();
        const invalidField = findField(heirarchy.customerRecord, "age");
        invalidField.typeOptions.minValue = "hello";
        let validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.minValue", invalidField);

        invalidField.typeOptions.minValue = null;
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.minValue", invalidField);

        invalidField.typeOptions.minValue = 1.1;
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.minValue", invalidField);
    });

    it("field.typeOptions > number > should return error when maxValue is not an integer", () => {
        const heirarchy = createValidHeirarchy();
        const invalidField = findField(heirarchy.customerRecord, "age");
        invalidField.typeOptions.maxValue = "hello";
        let validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.maxValue", invalidField);

        invalidField.typeOptions.maxValue = null;
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.maxValue", invalidField);

        invalidField.typeOptions.maxValue = 1.1;
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.maxValue", invalidField);
    });

    it("field.typeOptions > number > should return error when decimal places is not a positive integer", () => {
        const heirarchy = createValidHeirarchy();
        const invalidField = findField(heirarchy.customerRecord, "age");
        invalidField.typeOptions.decimalPlaces = "hello";
        let validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.decimalPlaces", invalidField);

        invalidField.typeOptions.decimalPlaces = null;
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.decimalPlaces", invalidField);

        invalidField.typeOptions.decimalPlaces = -1;
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.decimalPlaces", invalidField);

        invalidField.typeOptions.decimalPlaces = 1.1;
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.decimalPlaces", invalidField);
    });

    it("field.typeOptions > reference > should return error when indexNodeKey is not a compmleted string", () => {
        const heirarchy = createValidHeirarchy();
        const invalidField = findField(heirarchy.customerRecord, "partner");
        invalidField.typeOptions.indexNodeKey = null;
        let validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.indexNodeKey", invalidField);

        invalidField.typeOptions.indexNodeKey = "";
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.indexNodeKey", invalidField);

        invalidField.typeOptions.indexNodeKey = 1;
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.indexNodeKey", invalidField);
    });

    it("field.typeOptions > reference > should return error when reverseIndexNodeKeys is not a string array of >0 length", () => {
        const heirarchy = createValidHeirarchy();
        const invalidField = findField(heirarchy.customerRecord, "partner");
        invalidField.typeOptions.reverseIndexNodeKeys = null;
        let validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.reverseIndexNodeKeys", invalidField);

        invalidField.typeOptions.reverseIndexNodeKeys = "";
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.reverseIndexNodeKeys", invalidField);

        invalidField.typeOptions.reverseIndexNodeKeys = [];
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.reverseIndexNodeKeys", invalidField);

        invalidField.typeOptions.reverseIndexNodeKeys = "/not/an/array";
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.reverseIndexNodeKeys", invalidField);

        invalidField.typeOptions.reverseIndexNodeKeys = ["/some/key/here"];
        validationResult = validateAll(heirarchy.root);
        expect(validationResult.length).toBe(0);
    });

    it("field.typeOptions > reference > should return error when displayValue is not a compmleted string", () => {
        const heirarchy = createValidHeirarchy();
        const invalidField = findField(heirarchy.customerRecord, "partner");
        invalidField.typeOptions.displayValue = null;
        let validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.displayValue", invalidField);

        invalidField.typeOptions.displayValue = "";
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.displayValue", invalidField);

        invalidField.typeOptions.displayValue = 1;
        validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "typeOptions.displayValue", invalidField);
    });

});
