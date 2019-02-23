import {applyRuleSet, makerule, applyRule} from "../common/validationCommon";
import {permissionTypes, WHITELIST, BLACKLIST} from "./authCommon";
import {values, includes, map, concat, isEmpty, uniqWith,
    flatten, filter} from "lodash/fp";
import {$, isSomething, insensitiveEquals,
    isNonEmptyString, none, isNothing, isArrayOfString} from "../common";
import {getNode} from "../templateApi/heirarchy";

const userRules = allUsers => [
    makerule("name", "username must be set",
        u => isNonEmptyString(u.name)),
    makerule("accessLevels", "user must have at least one access level",
        u => u.accessLevels.length > 0),
    makerule("name", "username must be unique",
        u => filter(u2 => insensitiveEquals(u2,u))(allUsers).length > 1),
    makerule("accessLevels", "access levels must only contain stings",
        u => all(isNonEmptyString)(u.accessLevels))
];

export const validateUser = app => (allusers, user) => {



};