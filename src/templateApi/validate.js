// name not null
// name(path?) not duplicated
// view.index has a map 
// view.index.map produces an object with memebers
// record has fields
// collection has type/children
// field types recognised
// field names valid

import {$, isSomething, switchCase
        ,anyTrue, isNonEmptyArray
        , isNonEmptyString, defaultCase
        , executesWithoutException} from "../common";
import {isCollection, isRecord, isRoot, 
        isView, getFlattenedHierarchy} from "./heirarchy";
import {reduce, union, constant, 
        map, flatten, every} from "lodash/fp";
import {has} from "lodash";
import {compileFilter, compileMap} from "../indexing/evaluate";


const stringNotEmpty = s => isSomething(s) && s.trim().length > 0;

const validationError = (rule, node) => ({...rule, node});
export const makerule = (field, error, isValid) => ({field, error, isValid});


const commonRules = [
    makerule("name", "node name is not set", 
         node => stringNotEmpty(node.name)),
    makerule("type", "node type not recognised",
        anyTrue(isRecord, isCollection, isRoot, isView ))
];

const recordRules = [
    makerule("fields", "no fields have been added to the record",
        node => isNonEmptyArray(node.fields)),
    makerule("validationRules", "validation rule is missing a 'messageWhenValid' member",
        node => every(r => has(r, "messageWhenInvalid"))
                (node.validationRules)),
    makerule("validationRules", "validation rule is missing a 'expressionWhenValid' member",
        node => every(r => has(r, "expressionWhenValid"))
                (node.validationRules)),
];

const collectionRules = [
    makerule("children", "collection does not have and children",
        node => isNonEmptyArray(node.children))
];
const viewRules = [
    makerule("index", "view index has no map function",
        node => isNonEmptyString(node.index.map)),
    makerule("index", "view index's map function does not compile",
        node => !isNonEmptyString(node.index.map)
                || executesWithoutException(() => compileMap(node.index))),
    makerule("index", "view index's filter function does not compile",
        node => !isNonEmptyString(node.index.filter)
                ||  executesWithoutException(() => compileFilter(node.index)))
];

const ruleSet = (...sets) => 
    constant(union(...sets));

const applyRule = (errors, rule, node) => 
    rule.isValid(node) 
    ? errors 
    : union(errors)([validationError(rule, node)]);


const getRuleSet = 
    switchCase(
        [isCollection, ruleSet(commonRules, collectionRules)],
        [isRecord, ruleSet(commonRules, recordRules)],
        [isView, ruleSet(commonRules, viewRules)],
        [defaultCase, ruleSet(commonRules, [])]
    );


export const validate = node => 
    $(node, [
        getRuleSet,
        reduce((errors,rule) => 
            applyRule(errors, rule, node) 
        , [])
    ]);

export const validateAll = appHeirarchy => 
    $(appHeirarchy, [
        getFlattenedHierarchy,
        map(validate),
        flatten
    ]);