import {makerule, typeFunctions, getNewValue
        , parsedFailed, parsedSuccess, getDefaultExport} from "./typeHelpers";
import {constant, isDate, isString, isNull} from "lodash";
import {switchCase, defaultCase, $, handleErrorWith} from "../common";

const dateFunctions = typeFunctions({
    default: constant(null),
    now: () => new Date()
});

const isValidDate = d => 
    d instanceof Date && !isNaN(d);

const parseStringToDate = s => 
    switchCase(
        [isValidDate, parsedSuccess],
        [defaultCase, parsedFailed]
    )(new Date(s));
    

const dateTryParse = 
    switchCase(
        [isDate, parsedSuccess],
        [isString, parseStringToDate],
        [isNull, parsedSuccess],
        [defaultCase, parsedFailed]
    );

const options = {
    maxValue: {
        defaultValue: null,
        nullAllowed: true, 
        valueIfNull: new Date(8640000000000000)},
    minValue: {
        defaultValue: null, 
        nullAllowed: false, 
        valueIfNull: new Date(-8640000000000000)}
};

const typeConstraints = [
    makerule((val,opts) => val === null || opts.minValue === null || val >= opts.minValue,
             (val,opts) => `value (${val.toString()}) must be greater than or equal to ${opts.minValue}`),
    makerule((val,opts) => val === null || opts.maxValue === null || val <= opts.maxValue, 
             (val,opts) => `value (${val.toString()}) must be less than or equal to ${opts.minValue} options`)
];

export default getDefaultExport(
    "datetime", 
    dateTryParse, 
    dateFunctions,
    options, 
    typeConstraints,
    new Date(1984,4,1));