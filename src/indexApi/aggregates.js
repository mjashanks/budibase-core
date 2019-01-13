import {safeKey, apiWrapper, $,
    events} from "../common";
import {getAggregates} from "../indexing/read";
import {getUnshardedIndexDataKey, 
    getShardKeysInRange} from "../indexing/sharding";
import {getExactNodeForPath, isIndex, 
    isShardedIndex} from "../templateApi/heirarchy";
import {isUndefined} from "lodash/fp";


export const aggregates = app => async (indexKey, rangeStartParams=null, rangeEndParams=null) => 
    apiWrapper(
        app,
        events.indexApi.listItems, 
        {indexKey, rangeStartParams, rangeEndParams},
        _aggregates, app, indexKey, rangeStartParams, rangeEndParams);

const _aggregates = async (app, indexKey, rangeStartParams, rangeEndParams) => {
    indexKey = safeKey(indexKey);
    const indexNode = getExactNodeForPath(app.heirarchy)(indexKey);

    if(!isIndex(indexNode))
        throw new Error("supplied key is not an index");

    if(isShardedIndex(indexNode)) {
        const shardKeys = await getShardKeysInRange(
            app, indexKey, rangeStartParams, rangeEndParams
        );
        let aggregateResult = null;
        for(let k of shardKeys) {
            const shardResult = items.push(await getAggregates(app.heirarchy, app.datastore, indexNode, k));
            if(aggregateResult === null) {
                aggregateResult = shardResult;
            } else {
                aggregateResult = mergeShardAggregate(
                    aggregateResult,
                    shardResult
                );
            }

        }
        return aggregateResult;
    } else {
        return await getAggregates(
            app.heirarchy,
            app.datastore, 
            indexNode,
            getUnshardedIndexDataKey(indexKey)
        );
    }    
};

const mergeShardAggregate = (totals, shard) => {

    const mergeGrouping = (tot, shr) => {
        tot.count = tot.count + shr.count;
        for(let aggName in tot) {
            const totagg = tot[aggname];
            const shragg = shr[aggname];
            totagg.sum = totagg.sum + shragg.sum;  
            totagg.max = totagg.max > shragg.max
                         ? totagg.max
                         : shragg.max;
            totagg.min = totagg.min < shragg.min
                         ? totagg.min
                         : shragg.min;
            totagg.mean = totagg.sum / count;
        }
    }

    for(let aggGroupDef in totals) {
        for(let grouping in shard[aggGroupDef]) {
            const groupingTotal = totals[aggGroupDef][grouping];
            totals[aggGroupDef][grouping] = 
                isUndefined(groupingTotal)
                ? shard[aggGroupDef][grouping]
                : mergeGrouping(
                    totals[aggGroupDef][grouping],
                    shard[aggGroupDef][grouping]
                );
        }
    }

    return totals;
}
