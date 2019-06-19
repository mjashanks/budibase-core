import { compileExpression, compileCode } from '@nx-js/compiler-util';
import { includes } from 'lodash/fp';
import { allowedaggregates } from '../templateApi/validateAggregate';
import { joinKey } from '../common';

export const add = async (store, mappedRecord, indexKey, indexNode) => {
  const applyAggregateForAdd = async (aggGroupNode) => {
    const aggGroupData = await datastore.readJson(
      joinKey(indexKey, aggGroupNode.name),
    );
    for (const agg of aggGroupNode.aggregates) {

    }
  };

  for (const aggGroupNode of indexNode.aggregateGroups) {
    await applyAggregateForAdd(aggGroupNode);
  }
};

export const remove = async (store, mappedRecord, indexKey, indexNode) => {
};

export const update = async (store, mappedRecord, indexKey, indexNode) => {
};

const applyaggregateForAdd = (aggGroupData, agg) => {

};


const applyFunctions = (data, agg, record) => {
  const appliedFunctions = [];

  const getAggValue = (funcName) => {
    if (funcName === 'count') return 0; // doesnt matter for count
    return compileCode(agg.aggregatedValue)({ record });
  };

  const run = (funcName, calcNewResult) => {
    if (includes(funcName)(appliedFunctions)) return;
    if (compileExpression(agg.condition)({ record }) === true) {
      const aggValue = getAggValue(funcName);
      data[agg.name][funcName] = calcNewResult(
        data[agg.name],
        aggValue,
      );
    }
    appliedFunctions.push(funcName);
  };

  const forAdd = () => {
    const count = () => run('count', current => current.count + 1);
    const sum = () => run('sum', (current, val) => current.sum + val);
    const mean = () => {
      count();
      sum();
      run('mean', current => current.sum / current.count);
    };
    const max = () => {};
    const min = () => {};

    return ({
      count, sum, mean, max, min,
    });
  };

  const forRemove = () => {
    const count = () => run('count', current => current.count - 1);
    const sum = () => run('sum', (current, val) => current.sum - val);
    const mean = () => {
      count();
      sum();
      run('mean', current => current.sum / current.count);
    };
    const max = () => {};
    const min = () => {};

    return ({
      count, sum, mean, max, min,
    });
  };

  return ({ forAdd: forAdd(), forRemove: forRemove() });
};
