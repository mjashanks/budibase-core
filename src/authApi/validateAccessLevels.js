import {applyRuleSet, makerule, applyRule} from "../common/validationCommon";
import {permissionTypes, WHITELIST, BLACKLIST} from "./authCommon";
import {keys, includes, map, flatten, filter} from "lodash/fp";
import {$, isSomething, 
    isNonEmptyString, none, isNothing} from "../common";
import {getNode} from "../templateApi/heirarchy";

const isAllowedType = t => 
    $(permissionTypes, [
        keys, 
        includes(t)
    ]);

const isRecordOrIndexType = t => 
    includes("record")(t) ||
    includes("index")(t);


const permissionRules = app => ([
    makerule("type", "type must be one of allowed types",
        p => isAllowedType(p.type)),
    makerule("nodeKey", "record and index permissions must include a valid nodeKey",
        p => (!isRecordOrIndexType(p.type)) 
             ||  isSomething(getNode(app.heirarchy, p.nodeKey)))
]);

const accessLevelRules = allLevels => ([
    makerule("name", "name must be set",
        l => isNonEmptyString(l.name)),
    makerule("name", "access level names must be unique",
        l => isEmpty(l.name) 
             || filter(a => insensitiveEquals(l.name, a.name))(allLevels).length > 1),
    makerule("accessType", "accessType must be whitelist or blacklist",
        l => l.accessType === WHITELIST || l.accessType === BLACKLIST)
]);

export const validateAccessLevel = app => (allLevels, level) => {

    const errs = $(level.permissions, [
        map(perm =>  $(permissionRules(app), [
            applyRule(perm)
        ])),
        flatten,
        concat(
            $(accessLevelRules(allLevels), [
                applyRule(level)
            ])
        )
    ]);

    return errs;

};

export const validateAccessLevels = app => allLevels => 
    $(allLevels, [
        map(l => validateAccessLevel(app)(allLevels, l)),
        flatten
    ]);
