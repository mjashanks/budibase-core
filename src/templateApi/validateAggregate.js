import {applyRuleSet, makerule} from "./validationCommon";
import {flatten, map} from "lodash/fp";
import {isEmpty, difference} from "lodash";
import {isNonEmptyString, executesWithoutException, 
        $, isNonEmptyArray} from "../common";
import {compileExpression, compileCode} from "@nx-js/compiler-util";

const aggregateRules = [
    makerule("name", "choose a name for the aggregate",
        a => isNonEmptyString(a.name)),
    makerule("aggregatedValue", "aggregatedValue does not compile",
        a => isEmpty(a.aggregatedValue)
            || executesWithoutException(
                () => compileCode(a.aggregatedValue)))
];

export const validateAggregate = (aggregate) => 
    applyRuleSet(aggregateRules)(aggregate);

export const validateAllAggregates = all => 
    $(all, [
        map(validateAggregate),
        flatten
    ]);