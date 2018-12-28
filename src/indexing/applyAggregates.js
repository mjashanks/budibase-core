import {allowedAggregateFunctions} from "../templateApi/validateAggregate";
import {joinKey} from "../common";
import {compileExpression, compileCode} from "@nx-js/compiler-util";
import {includes} from "lodash/fp";

export const add = async (store, mappedRecord, indexKey, indexNode) => {
    const applyAggregateForAdd = async aggSetNode => {
        const aggSetData = await datastore.readJson(
            joinKey(indexKey, aggSetNode.name)
        );
        for(let aggFunc of aggSetNode.aggregateFunctions) {

        }
    };

    for(let aggSetNode of indexNode.aggregateSets) {
        await applyAggregateForAdd(aggSetNode);
    }
};

export const remove = async (store, mappedRecord, indexKey, indexNode) => {
};

export const update = async (store, mappedRecord, indexKey, indexNode) => {
};

const applyAggregateFunctionForAdd = (aggSetData, aggFunc) => {

};



const applyFunctions = (data, aggFunc, record) => {
    
    const appliedFunctions = [];

    const getAggValue = funcName => {
        if(funcName === "count") return 0; // doesnt matter for count
        return compileCode(aggFunc.aggregatedValue)({record});
    };

    const run = (funcName, calcNewResult) => {
        if(includes(funcName)(appliedFunctions)) return;
        if(compileExpression(aggFunc.condition)({record:record}) === true) {
            const aggValue = getAggValue(funcName);
            data[aggFunc.name][funcName] = calcNewResult(
                data[aggFunc.name], 
                aggValue
            );
        }
        appliedFunctions.push(funcName);
    };

    const forAdd = () => {
        const count = () => run("count", current => current.count + 1);
        const sum = () => run("sum", (current, val) => current.sum + val);
        const mean = () => {
            count();
            sum();
            run("mean", (current) => current.sum / current.count);
        };
        const max = () => {};
        const min = () => {};

        return ({
            count, sum, mean, max, min
        });
    };

    const forRemove = () => {
        const count = () => run("count", current => current.count - 1);
        const sum = () => run("sum", (current, val) => current.sum - val);
        const mean = () => {
            count();
            sum();
            run("mean", (current) => current.sum / current.count);
        };
        const max = () => {};
        const min = () => {};

        return ({
            count, sum, mean, max, min
        });
    };

    return ({forAdd:forAdd(), forRemove:forRemove()});
};