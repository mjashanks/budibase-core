import {getSafeFieldParser, typeFunctions, 
    makerule, parsedFailed, parsedSuccess,
    getDefaultExport} from "./typeHelpers";
import {constant, isBoolean, isNull} from "lodash";
import {switchCase, defaultCase, isOneOf, toBoolOrNull} from "../common";

const boolFunctions = typeFunctions({
    default: constant(null)
});

const boolTryParse = 
    switchCase(
        [isBoolean, parsedSuccess],
        [isNull, parsedSuccess],
        [isOneOf("true", "1", "yes", "on"), v => parsedSuccess(true)],
        [isOneOf("false", "0", "no", "off"), v => parsedSuccess(false)],
        [defaultCase, parsedFailed]
    );

const options = {
    allowNulls: {
        defaultValue: true, 
        isValid: isBoolean,
        requirementDescription: "must be a true or false",
        parse: toBoolOrNull
    }
};

const typeConstraints = [
    makerule(async (val,opts) => opts.allowNulls === true || val !== null, 
             (val,opts) => "field cannot be null")
]; 

export default getDefaultExport(
    "bool", boolTryParse, boolFunctions, 
    options, typeConstraints, true, JSON.stringify);