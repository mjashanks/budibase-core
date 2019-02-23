import {applyRuleSet, makerule} from "../common/validationCommon";
import {map, uniqWith,
    flatten, filter} from "lodash/fp";
import {$, insensitiveEquals,
    isNonEmptyString, all} from "../common";

const userRules = allUsers => [
    makerule("name", "username must be set",
        u => isNonEmptyString(u.name)),
    makerule("accessLevels", "user must have at least one access level",
        u => u.accessLevels.length > 0),
    makerule("name", "username must be unique",
        u => filter(u2 => insensitiveEquals(u2.name,u.name))
                   (allUsers).length === 1),
    makerule("accessLevels", "access levels must only contain stings",
        u => all(isNonEmptyString)(u.accessLevels))
];

export const validateUser = () => (allusers, user) => 
    applyRuleSet(userRules(allusers))(user);

export const validateUsers = app => (allUsers) => 
    $(allUsers, [
        map(l => validateUser(app)(allUsers, l)),
        flatten,
        uniqWith((x,y) => x.field === y.field
                        && x.item === y.item
                        && x.error === y.error)
    ]);
