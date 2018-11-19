import {applyRuleSet, makerule} from "./validationCommon";
import {compileFilter, compileMap} from "../indexing/evaluate";
import {isUndefined, isEmpty, 
        countBy, union} from "lodash/fp";
import {isNonEmptyString, executesWithoutException} from "../common";
import { all } from "../types";

export const getNewIndex = () => ({
    map:"return {...record};",
    filter:"",
    name:"",
    type:"index"
});

export const addNewReferenceIndex = recordNode => {
    const index = getNewIndex();
    recordNode.referenceIndexes.push(index);
    return index;
};

const ruleSet = [
    makerule("map", "index has no map function",
        index => isNonEmptyString(index.map)),
    makerule("map", "index's map function does not compile",
        index => !isNonEmptyString(index.map)
                || executesWithoutException(() => compileMap(index))),
    makerule("filter", "index's filter function does not compile",
        index => !isNonEmptyString(index.filter)
                ||  executesWithoutException(() => compileFilter(index)))
];

const referenceIndexRules = allReferenceIndexesOnNode => [
    makerule("name", "must declare a name for reference index",
        index => isNonEmptyString(index.map)),
    makerule("name", "there is a duplicate named reference index on this node",
        index => isEmpty(index.map)  
                 || countBy(i => i.name)
                    (allReferenceIndexesOnNode)[index.name] === 1) 
];

export const validateIndex = (index, allReferenceIndexesOnNode = null) => {

    const isReferenceIndex = !isUndefined(
        allReferenceIndexesOnNode);
    
    const rules = isReferenceIndex
                  ? union(ruleSet)
                    (referenceIndexRules(allReferenceIndexesOnNode))
                  : ruleSet;

    return applyRuleSet(rules)(index);
};
