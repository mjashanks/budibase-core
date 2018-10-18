import {has, keys} from "lodash";
import {some, map, union} from "lodash/fp";
import {isSomething, $} from "../common";
import {all, getDefaultOptions} from "../types";

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

export const validateField = (recordTemplate, field) => {

    const errors = [];

    const addError = message => errors.push(message);
    const addErrorIf = (condition, message) =>
         condition ? addError(message) : undefined;

    const IsSet = (memberName) => 
        has(field, memberName) 
        && isSomething(field[memberName]) 
        && field[memberName].length > 0
        ? "" 
        : `${memberName} is not set`; 

    const IsDefined = (memberName) => 
        has(field, memberName) 
        ? ""  
        : `${memberName} is undefined`;
    
    const ExistsIn = list => memberName => 
        some(l => field[memberName] === l)(list)
        ? ""
        : `${memberName}:'${field[memberName]}' is not recognised`;
    
    const NotExistsIn = list => memberName => 
        !some(l => field[memberName] === l)(list)
        ? ""
        : `${memberName}:'${field[memberName]}' already exists`;
    
    const test = (memberName, ...testFuncs) => {
        for(let f of testFuncs) {
            const error = f(memberName);
            if(error.length > 0) {
                addError(error);
                return; // 1 error per member at once
            }
        }
    };

    const existingFields = map(f => f.name)(recordTemplate.fields);
    test("name", IsDefined, IsSet, NotExistsIn(existingFields));

    const types = allowedTypes();
    test("type", IsDefined, IsSet, ExistsIn(types));
    test("label", IsDefined);
    test("getInitialValue", IsDefined, IsSet);
    test("getUndefinedValue", IsDefined, IsSet);

    return errors;
};

export const addField = (recordTemplate, field) => {
    const validationMessages = validateField(recordTemplate, field);
    if(validationMessages.length > 0) 
        throw new Error(fieldErrors.AddFieldValidationFailed + " " + validationMessages.join(", ")); 
    recordTemplate.fields.push(field);
};