import {getExactNodeForPath} from "../templateApi/heirarchy";
import {validateFieldParse, validateTypeConstraints} from "../types";
import {map, reduce, filter, isEmpty, flatten} from "lodash/fp";
import {$, isNothing} from "../common";
import {compileExpression} from "@nx-js/compiler-util";
import _ from "lodash";
import {getContext} from "./getContext";

const fieldParseError = (fieldName, value) => 
    ({fields:[fieldName], 
    message: `Could not parse field ${fieldName}:${value}`});

const validateAllFieldParse = (record, recordNode) => 
    $(recordNode.fields, [
        map(f => ({name:f.name, parseResult:validateFieldParse(f, record)})),
        reduce((errors, f) => {
            if(f.parseResult.success) return errors;
            errors.push(
                fieldParseError(f.name, f.parseResult.value));
            return errors;
        }, [])
    ]);

const validateAllTypeConstraints = (record, recordNode, context) => 
    $(recordNode.fields, [
        map(f => 
            $(validateTypeConstraints(f, record, context), [
                map(m => ({message:m, fields:[f.name]}))
            ])),
        flatten
    ]);

const runRecordValidationRules = (record, recordNode) => {

    const runValidationRule = rule => {
        const isValid = compileExpression(rule.expressionWhenValid);
        const expressionContext = {record, _};
        return (isValid(expressionContext)
            ? {valid:true}
            : ({valid:false, 
                fields: rule.invalidFields, 
                message:rule.messageWhenInvalid}));
    };

    return $(recordNode.validationRules, [
        map(runValidationRule),
        flatten,
        filter(r => r.valid === false),
        map(r => ({fields:r.fields, message:r.message}))
    ]);
}

export const validate = app => (record, context) => {
    context = isNothing(context) 
              ? getContext(app)(record.key())
              : context;

    const recordNode = getExactNodeForPath(app.heirarchy)(record.key());
    const fieldParseFails =  validateAllFieldParse(record, recordNode);
    
    // non parsing would cause further issues - exit here
    if(!isEmpty(fieldParseFails))
        return ({isValid:false, errors:fieldParseFails});

    const recordValidationRuleFails = runRecordValidationRules(record, recordNode);
    const typeContraintFails = validateAllTypeConstraints(record, recordNode, context);

    if(isEmpty(fieldParseFails) 
       && isEmpty(recordValidationRuleFails)
       && isEmpty(typeContraintFails)) {
           return ({isValid:true, errors:[]});
    }
    
    return ({
        isValid:false, 
        errors: _.union(fieldParseFails, typeContraintFails, recordValidationRuleFails)});
}
