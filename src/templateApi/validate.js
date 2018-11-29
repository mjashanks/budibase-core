import {$, isSomething, switchCase
        ,anyTrue, isNonEmptyArray
        , isNonEmptyString, defaultCase
        , executesWithoutException,
        tryOr} from "../common";
import {isCollection, isRecord, isRoot, 
        isIndex, getFlattenedHierarchy} from "./heirarchy";
import {filter, union, constant, 
        map, flatten, every, uniqBy,
        some, includes, countBy} from "lodash/fp";
import {has} from "lodash";
import {compileFilter, compileMap} from "../indexing/evaluate";
import {eventsList} from "../common/events";
import {compileExpression, compileCode} from "@nx-js/compiler-util";
import {validateAllFields} from "./fields";
import {applyRuleSet, makerule, stringNotEmpty, 
        validationError} from "./validationCommon";
import {indexRuleSet} from "./indexes";

export const ruleSet = (...sets) => 
    constant(flatten([...sets]));

const commonRules = [
    makerule("name", "node name is not set", 
         node => stringNotEmpty(node.name)),
    makerule("type", "node type not recognised",
        anyTrue(isRecord, isCollection, isRoot, isIndex ))
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

const getRuleSet = node => 
    switchCase(
        [isCollection, ruleSet(
                        commonRules, 
                        collectionRules)],

        [isRecord, ruleSet(
                    commonRules, 
                    recordRules)],

        [isIndex, ruleSet(
                      commonRules, 
                      indexRuleSet)],

        [defaultCase, ruleSet(commonRules, [])]
    )(node);

export const validateNode = node => 
    applyRuleSet(getRuleSet(node))(node);

export const validateAll = appHeirarchy => {
    
    var flattened = getFlattenedHierarchy(
        appHeirarchy
    );

    const duplicateNameRule = makerule(
        "name", "node names must be unique under shared parent",
        n => filter(f => f.parent() === n.parent()
                          && f.name === n.name) 
                    (flattened).length === 1
    );

    const duplicateNodeKeyErrors = $(flattened, [
        map(n => applyRuleSet([duplicateNameRule])(n)),
        filter(isSomething),
        flatten
    ]);

    const fieldErrors = $(flattened, [
        filter(isRecord),
        map(validateAllFields),
        flatten
    ]);

    return $(flattened, [
        map(validateNode),
        flatten,
        union(duplicateNodeKeyErrors),
        union(fieldErrors)
    ]);
};

const actionRules = [
    makerule("name", "action must have a name", 
        a => isNonEmptyString(a.name)),
    makerule("behaviourName", "must supply a behaviour name to the action",
        a => isNonEmptyString(a.behaviourName)),
    makerule("behaviourSource", "must supply a behaviour source for the action",
        a => isNonEmptyString(a.behaviourSource)),
];

const duplicateActionRule = 
    makerule("", "action name must be unique", () =>{});

const validateAction = action => 
    applyRuleSet(actionRules)(action);


export const validateActions = (allActions) => {
    
    const duplicateActions = $(allActions, [
        filter(a => filter(a2 => a2.name === a.name)
                          (allActions).length > 1),
        map(a => validationError(duplicateActionRule, a))
    ]);
    
    const errors = $(allActions, [
        map(validateAction),
        flatten,
        union(duplicateActions),
        uniqBy("name")
    ]);

    return errors;
};

const triggerRules = actions => ([
    makerule("actionName", "must specify an action", 
        t => isNonEmptyString(t.actionName)),
    makerule("eventName", "must specify and event",
        t => isNonEmptyString(t.eventName)),
    makerule("actionName", "specified action not supplied",
        t => !t.actionName 
             || some(a => a.name === t.actionName)(actions)),
    makerule("eventName", "invalid Event Name",
        t => !t.eventName 
             || includes(t.eventName)(eventsList)),
    makerule("optionsCreator", "Options Creator does not compile - check your expression",
        t => {
            if(!t.optionsCreator) return true;
            try { 
                compileCode(t.optionsCreator);
                return true;
            } catch(_) { return false; }
        }),
    makerule("condition", "Trigger condition does not compile - check your expression",
        t => {
            if(!t.condition) return true;
            try { 
                compileExpression(t.condition);
                return true;
            } catch(_) { return false; }
        })
]);

export const validateTrigger = (trigger, allActions) => {

    const errors = applyRuleSet(triggerRules(allActions))(trigger);

    return errors;
};

export const validateTriggers = (triggers, allActions) => 
    $(triggers, [
        map(t => validateTrigger(t, allActions)),
        flatten
    ]);
    