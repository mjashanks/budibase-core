import {applyRuleSet, makerule} from "./validationCommon";
import {flatten, map} from "lodash/fp";
import {isEmpty, difference} from "lodash";
import {isNonEmptyString, executesWithoutException, 
        $, isNonEmptyArray} from "../common";
import {compileExpression, compileCode} from "@nx-js/compiler-util";

export const allowedAggregateFunctions = [
    "count", "sum", "max", "min", "average"
];

const aggregateRules = [
    makerule("name", "choose a name for the aggregate function",
        a => isNonEmptyString(a.name)),
    makerule("condition", "condition does not compile",
        a => isEmpty(a.condition)
             || executesWithoutException(
                    () => compileExpression(a.condition))),
    makerule("functions", "must include at least one function",
        a => isNonEmptyArray(a.functions)),
    makerule("functions", "function must be one of allowed type",
        a => isEmpty(a.functions) 
             || difference(
                 a.functions,
                 allowedAggregateFunctions
             ).length === 0),
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