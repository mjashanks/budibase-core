import {typeFunctions, makerule, 
    parsedSuccess, getDefaultExport, 
    parsedFailed} from "./typeHelpers";
import {isString, isObjectLike, 
    isNull, has, isEmpty} from "lodash";
import {switchCase, defaultCase} from "../common";
import {uniqueIndexName} from "../indexing/read";

const referenceNothing = () => ({key:"",value:""});

const referenceFunctions = typeFunctions({
    default: referenceNothing 
});

const hasStringValue = (ob, path) => 
    has(ob, path) 
    && isString(ob[path]);

const isKeyValue = v => 
    isObjectLike(v) 
    && hasStringValue(v, "key")
    && hasStringValue(v, "value");

const referenceTryParse = v =>
    switchCase(
        [isKeyValue, parsedSuccess],
        [isNull, () => parsedSuccess(referenceNothing())],
        [defaultCase, parsedFailed]
    )(v);

const options = {
    viewNodeKey: {
        defaultValue: null,
        nullAllowed: false
    },
    displayValue: {
        defaultValue: "", 
        nullAllowed: false}
};

const isEmptyString = s => 
    isString(s) && isEmpty(s);

const ensureReferenceExists = (val, opts, context) => 
    isEmptyString(val.key) 
    || context.referenceExistsInIndex(
        uniqueIndexName(opts.index), val);

const typeConstraints = [
    makerule(
        ensureReferenceExists,
        (val,opts) => `"${val[opts.displayValue]}" does not exist in options list (key: ${val.key})`)
]; 

export default getDefaultExport(
    "reference", 
    referenceTryParse, 
    referenceFunctions,
    options, 
    typeConstraints);