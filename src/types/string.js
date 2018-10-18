import {getSafeFieldParser, typeFunctions, getNewValue, 
    makerule, parsedSuccess, getDefaultExport} from "./typeHelpers";
import {constant, isString, isNull, includes} from "lodash";
import {switchCase, defaultCase} from "../common";

const stringFunctions = typeFunctions({
    default: constant(null)
});

const stringTryParse = 
    switchCase(
        [isString, parsedSuccess],
        [isNull, parsedSuccess],
        [defaultCase, v => parsedSuccess(v.toString())]
    );

const options = {
    maxLength: {
        defaultValue: null, 
        nullAllowed: true,
        valueIfNull: null
    },
    values: {
        defaultValue: null,
        nullAllowed: true,
        valueIfNull: []
    },
    allowDeclaredValuesOnly: {
        defaultValue: false,
        nullAllowed: true,
        valueIfNull: false
    }
};

const typeConstraints = [
    makerule((val,opts) => val === null || opts.maxLength === null || val.length <= opts.maxLength, 
             (val,opts) => `value exceeds maximum length of ${opts.maxLength}`),
    makerule((val, opts) => val === null  
                           || opts.allowDeclaredValuesOnly === false 
                           || includes(opts.values, val),
             (val,opts) => `"${val}" does not exist in the list of allowed values`) 
]; 

export default getDefaultExport(
    "string", 
    stringTryParse, 
    stringFunctions,
    options, 
    typeConstraints);