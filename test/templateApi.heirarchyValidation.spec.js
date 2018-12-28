import {validateAll} from "../src/templateApi/validate";
import createNodes from "../src/templateApi/createNodes";
import {some} from "lodash";
import {getNewField, addField} from "../src/templateApi/fields";
import {getNewRecordValidationRule, commonRecordValidationRules,
    addRecordValidationRule} from "../src/templateApi/recordValidationRules";

const createValidHeirarchy = () => {
    const root = createNodes.getNewRootLevel();

    const customerCollection = createNodes.getNewCollectionTemplate(root);
    customerCollection.name = "customers";

    const customersDefaultIndex = customerCollection.indexes[0];
    const customersNoGroupAggregateSet = createNodes.getNewAggregateSetTemplate(customersDefaultIndex);
    customersNoGroupAggregateSet.name = "Customers Summary";
    const allCustomersOwedFunctions = createNodes.getNewAggregateFunctionTemplate(customersNoGroupAggregateSet);
    allCustomersOwedFunctions.functions = ["count","max","min","sum","mean"];
    allCustomersOwedFunctions.aggregatedValue = "return record.owed";
    allCustomersOwedFunctions.name = "all customers owed amount";

    const partnersCollection = createNodes.getNewCollectionTemplate(root);
    partnersCollection.name = "partners";
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
    addField(customerRecord, surnameField);
    addRecordValidationRule(customerRecord)
            (commonRecordValidationRules.fieldNotEmpty("surname"));

    return {
        root, customerCollection, 
        customerRecord, customersDefaultIndex,
        customersNoGroupAggregateSet,
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

    it("aggregateSet > should return error when name is not supplied", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.customersNoGroupAggregateSet.name = "";
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "name", heirarchy.customersNoGroupAggregateSet);
    });

    it("aggregateSet > should return error no functions added", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.customersNoGroupAggregateSet.aggregateFunctions = [];
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "aggregateFunctions", heirarchy.customersNoGroupAggregateSet);
    });

    it("aggregateFunction > should return error when name note set", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.allCustomersOwedFunctions.name = "";
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "name", heirarchy.allCustomersOwedFunctions);
    });

    it("aggregateFunction > should return error when condition does not compile", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.allCustomersOwedFunctions.condition = "invalid condition";
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "condition", heirarchy.allCustomersOwedFunctions);
    });

    it("aggregateFunction > should return error when functions are empty", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.allCustomersOwedFunctions.functions = [];
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "functions", heirarchy.allCustomersOwedFunctions);
    });

    it("aggregateFunction > should return error when has unkonwn function", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.allCustomersOwedFunctions.functions = ["count", "invalid"];
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "functions", heirarchy.allCustomersOwedFunctions);
    });

    it("aggregateFunction > should return error when aggregatedValue does not compile", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.allCustomersOwedFunctions.aggregatedValue = "invalid value";
        const validationResult = validateAll(heirarchy.root);
        expectInvalidField(validationResult, "aggregatedValue", heirarchy.allCustomersOwedFunctions);
    });

    it("aggregateFunction > should be valid when valid condition and aggregatedValue supplied", () => {
        const heirarchy = createValidHeirarchy();
        heirarchy.allCustomersOwedFunctions.aggregatedValue = "return record.owed;";
        heirarchy.allCustomersOwedFunctions.condition = "record.owed > 0;";
        const validationResult = validateAll(heirarchy.root);
        expect(validationResult.length).toBe(0);
    });

});
