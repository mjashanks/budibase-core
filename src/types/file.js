import {typeFunctions, parsedFailed,
    parsedSuccess, getDefaultExport} from "./typeHelpers";
import {last, has, isString, intersection, 
    isNull, isNumber} from "lodash/fp";
import {switchCase, defaultCase, 
        $, splitKey} from "../common";

const illegalCharacters = "*?\\/:<>|\0\b\f\v";

const fileNothing = () => ({relativePath:"",size:0});

const fileFunctions = typeFunctions({
    default: fileNothing
});

const fileTryParse = v =>
    switchCase(
        [isValidFile, parsedSuccess],
        [isNull, () => parsedSuccess(fileNothing())],
        [defaultCase, parsedFailed]
    )(v);

const fileName = file => 
    $(file.relativePath, [
        splitKey,
        last
    ]);

const isValidFile = f => {
    return !isNull(f)
    && has("relativePath")(f) && has("size")(f)
    && isNumber(f.size)
    && isString(f.relativePath) 
    && fileName(f).length <= 255
    && intersection(illegalCharacters.split())(fileName(f).split()).length === 0;
}

const options = {};

const typeConstraints = []; 

export default getDefaultExport(
    "file", 
    fileTryParse, 
    fileFunctions,
    options, 
    typeConstraints,
    {relativePath:"some_file.jpg", size:1000},
    JSON.stringify);