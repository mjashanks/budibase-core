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

const isObjectWithKey = v => 
    isObjectLike(v) 
    && hasStringValue(v, "key");

const referenceTryParse = v =>
    switchCase(
        [isObjectWithKey, parsedSuccess],
        [isNull, () => parsedSuccess(referenceNothing())],
        [defaultCase, parsedFailed]
    )(v);

const options = {
    indexNodeKey: {
        defaultValue: null,
        nullAllowed: false
    },
    displayValue: {
        defaultValue: "", 
        nullAllowed: false},
    reverseIndex: {
        defaultValue: {
            map: "return {key: record.key()}",
            filter: "",
            name: ""
        },
        nullAllowed: false
    }
};

const isEmptyString = s => 
    isString(s) && isEmpty(s);

const ensureReferenceExists = async (val, opts, context) => 
    isEmptyString(val.key) 
    || await context.referenceExists(opts, val.key);

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
    typeConstraints,
    {key:"key", value:"value"},
    JSON.stringify);