import {has, keys} from "lodash";
import {some, map, 
        countBy, flatten} from "lodash/fp";
import {isSomething, $, 
        isNonEmptyString, 
        isNothingOrEmpty} from "../common";
import {all, getDefaultOptions} from "../types";
import {applyRuleSet, makerule} from "./validationCommon";

export const fieldErrors = {
    AddFieldValidationFailed : "Add field validation: "
};

export const allowedTypes = () => keys(all); 

export const getNewField = type => ({
    name: "",  // how field is referenced internally
    type: type,
    typeOptions: getDefaultOptions(type), 
    label: "", // how field is displayed
    getInitialValue : "default", // function that gets value when initially created
    getUndefinedValue : "default", // function that gets value when field undefined on record
});

const fieldRules = (allFields) => [
    makerule("name", "field name is not set",
            f => isNonEmptyString(f.name)),
    makerule("type", "field type is not set",
        f => isNonEmptyString(f.type)),
    makerule("label", "field label is not set",
        f => isNonEmptyString(f.label)),
    makerule("getInitialValue", "getInitialValue function is not set",
        f => isNonEmptyString(f.getInitialValue)),
    makerule("getUndefinedValue", "getUndefinedValue function is not set",
        f => isNonEmptyString(f.getUndefinedValue)),
    makerule("name", "field name is duplicated",
        f => isNothingOrEmpty(f.name) || 
             countBy("name")(allFields)[f.name] === 1),
    makerule("type", "type is unknown",
        f => isNothingOrEmpty(f.type) 
             || some(t => f.type === t)(allowedTypes()))
];

export const validateField = (allFields) => (field) =>
    applyRuleSet(fieldRules(allFields))(field);

export const validateAllFields = (recordNode) => 
    $(recordNode.fields, [
        map(validateField(recordNode.fields)),
        flatten
    ]);

export const addField = (recordTemplate, field) => {
    if(isNothingOrEmpty(field.label)) {
        field.label = field.name;
    }
    const validationMessages = validateField([...recordTemplate.fields, field])(field);
    if(validationMessages.length > 0) {
        const errors = map(m => m.error)(validationMessages);
        throw new Error(fieldErrors.AddFieldValidationFailed + " " + errors.join(", ")); 
    }
    recordTemplate.fields.push(field);
};