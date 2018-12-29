import {typeFunctions, makerule,
    parsedFailed, getDefaultExport, parsedSuccess} from "./typeHelpers";
import {constant, isArray} from "lodash";
import {map, every} from "lodash/fp";
import {switchCase, defaultCase, $$} from "../common";

const arrayFunctions = type => typeFunctions({
   default: constant([])
});

const mapToParsedArrary = type => $$(
    map(i => type.safeParseValue(i)),
    parsedSuccess
);

const arrayTryParse = type =>
   switchCase(
       [isArray, mapToParsedArrary(type)],
       [defaultCase, parsedFailed]
   );

const typeName = type => `array<${type}>`;

const options = {
    maxLength: {
        defaultValue: null, 
        nullAllowed: true, 
        valueIfNull: Number.MAX_SAFE_INTEGER},
    minLength: {
        defaultValue: null, 
        nullAllowed: true, 
        valueIfNull: 0}
};

const typeConstraints = [
    makerule((val,opts) => val === null || val.length >= opts.minLength, 
             (val,opts) => `must choose ${opts.minLength} or more options`),
    makerule((val,opts) => val === null || val.length <= opts.maxLength, 
             (val,opts) => `cannot choose more than ${opts.maxLength} options`)
]; 

export default type => 
    getDefaultExport(
        typeName(type.name),
        arrayTryParse(type), 
        arrayFunctions(type),
        options,
        typeConstraints,
        [type.sampleValue]
        );