import {getAllowedRecordNodesForIndex} from "../templateApi/heirarchy";
import {mapRecord} from "./evaluate";
import {constructRecord} from "../recordApi/getNew";
import {getSampleFieldValue, detectType, string} from "../types";
import {$} from "../common";
import {has, keys, map, orderBy, 
        filter, concat, reverse} from "lodash/fp";

export const generateSchema = (heirarchy, indexNode) => {

    const recordNodes = getAllowedRecordNodesForIndex(heirarchy, indexNode);
    const mappedRecords = $(recordNodes, [
        map(n => mapRecord(createSampleRecord(n), indexNode)),
    ]);

    // always has record key and sort key
    const schema = {
        sortKey:string,
        key: string,
    };

    const fieldsHas = has(schema);
    const setField = (fieldName, value) => {
        if(value === null || value === undefined)
            return;
            
        const thisType = detectType(value);
        if(fieldsHas(fieldName)) {
            if(schema[fieldName] !== thisType) {
                schema[fieldName] = string;
            }
        } else {
            schema[fieldName] = thisType;
        }
    };

    for(let mappedRec of mappedRecords) {
        for(let f in mappedRec) {
            setField(f, mappedRec[f]);
        }
    }

    // returing an array of {name, type}
    return $(schema, [
        keys,
        map(k => ({name:k, type:schema[k]})),
        filter(s => s.name === "sortKey"), 
        orderBy("name", ["desc"]), // reverse aplha
        concat([{name:"sortKey",type:string}]), // sortKey on end
        reverse // sortKey first, then rest are alphabetical
    ]);

};

const createSampleRecord = recordNode => 
    constructRecord(
        recordNode, 
        getSampleFieldValue, 
        recordNode.parent().nodeKey());