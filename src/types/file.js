import {typeFunctions,  
    parsedSuccess, getDefaultExport} from "./typeHelpers";
import {isString, intersection, has,
    isNull, isNumber} from "lodash";
import {last} from "lodash/fp";
import {switchCase, defaultCase, 
        $, splitKey} from "../common";

const illegalCharacters = ["*?\\/:<>|\0\b\f\v"];

const fileFunctions = typeFunctions({
    default: () => ({relativePath:"", size:0})
});

const fileTryParse = 
    switchCase(
        [isValidFile, parsedSuccess],
        [isNull, parsedSuccess],
        [defaultCase, v => parsedSuccess(v.toString())]
    );

const fileName = file => 
    $(file.relativePath, [
        splitKey,
        last
    ]);

const isValidFile = f => 
    has("relativePath")(f) && has("size")(f)
    && isNumber(f.size)
    && isString(f.relativePath) 
    && fileName(f).length <= 255
    && intersection(illegalCharacters)(fileName(f)).length === 0;

const options = {};

const typeConstraints = []; 

export default getDefaultExport(
    "file", 
    fileTryParse, 
    fileFunctions,
    options, 
    typeConstraints,
    {relativePath:"some_file.jpg", size:1000},
    str => str);