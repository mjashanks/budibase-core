import {makerule, typeFunctions, getNewValue
    , parsedFailed, parsedSuccess, getDefaultExport} from "./typeHelpers";
import {constant, isNumber, isString, isNull} from "lodash";
import {switchCase, defaultCase} from "../common";

const numberFunctions = typeFunctions({
    default: constant(null)
});

const parseStringToNumber = s => {
    const num = Number(s);
    return isNaN(num) ? parsedFailed(s) : parsedSuccess(num); 
};

const numberTryParse = 
    switchCase(
        [isNumber, parsedSuccess],
        [isString, parseStringToNumber],
        [isNull, parsedSuccess],
        [defaultCase, parsedFailed]
    );

const options = {
    maxValue: {
        defaultValue: null,
        nullAllowed: true, 
        valueIfNull: Number.MAX_VALUE },
    minValue: {
        defaultValue: null, 
        nullAllowed: true, 
        valueIfNull: 0-Number.MAX_VALUE},
    decimalPlaces: {
        defaultValue: null, 
        nullAllowed: true, 
        valueIfNull: 2}
};

const getDecimalPlaces = val => {
    var splitDecimal = val.toString().split(".");
    if(splitDecimal.length === 1) return 0;
    return splitDecimal[1].length;
}

const typeConstraints = [
    makerule((val,opts) => val === null || opts.minValue === null || val >= opts.minValue,
             (val,opts) => `value (${val.toString()}) must be greater than or equal to ${opts.minValue}`),
    makerule((val,opts) => val === null || opts.maxValue === null || val <= opts.maxValue, 
             (val,opts) => `value (${val.toString()}) must be less than or equal to ${opts.minValue} options`),
    makerule((val,opts) => val === null || opts.decimalPlaces >= getDecimalPlaces(val),
             (val,opts) => `value (${val.toString()}) must have ${opts.decimalPlaces} decimal places or less`)
];

export default getDefaultExport(
    "number", 
    numberTryParse, 
    numberFunctions, 
    options, 
    typeConstraints,
    1,
    num => num.toString());
