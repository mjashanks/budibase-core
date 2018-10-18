import {assign, keys, merge, has} from "lodash";
import { map, union} from "lodash/fp";
import {$} from "../common";
import {parsedSuccess} from "./typeHelpers";

import string from "./string";
import bool from "./bool";
import number from "./number";
import datetime from "./datetime";
import array from "./array";
import reference from "./reference";

const allTypes = () => {
    const basicTypes = {
        string, number, datetime, bool, reference
    };        

    const arrays = $(basicTypes, [
        keys,
        map(k => {
            const kvType = {};
            const concreteArray = array(basicTypes[k]);
            kvType[concreteArray.name] = concreteArray;
            return kvType;
        }),
        types => assign({}, ...types) 
    ]);
    
    return merge({}, basicTypes, arrays);
}; 


export const all = allTypes();

const getType = typeName =>  {
    if(!has(all, typeName)) throw new Error("Do not recognise type " + typeName);
    return all[typeName];
};

export const getNewFieldValue = field => 
    getType(field.type).getNew(field);

export const safeParseField = (field, record) => 
    getType(field.type).safeParseField(field, record);

export const validateFieldParse = (field, record) => 
    has(record, field.name) 
    ? getType(field.type).tryParse(record[field.name])
    : parsedSuccess(undefined); // fields may be undefined by default

export const getDefaultOptions = type => 
    getType(type).getDefaultOptions();

export const validateTypeConstraints = (field, record, context) => 
    getType(field.type).validateTypeConstraints(field, record, context);
