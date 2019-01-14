import { getHashCode,
    joinKey, isNonEmptyString,
    $} from "../common";
import {getActualKeyOfParent, 
         isGlobalIndex} from "../templateApi/heirarchy";
import {createIndexFile} from "../indexing/sharding";
import {getIndexReader, CONTINUE_READING_RECORDS} from "./serializer";
import {has, isNumber} from "lodash/fp";
import {compileExpression, compileCode} from "@nx-js/compiler-util";

export const readIndex = async (heirarchy, datastore, index, indexedDataKey) => {
    const records = [];
    const doRead = iterateIndex(
        item => {
            records.push(item);
            return CONTINUE_READING_RECORDS;
        },
        () => records
    )

    return await doRead(heirarchy, datastore, index, indexedDataKey);
};

export const getAggregates = async (heirarchy, datastore, index, indexedDataKey) => {
    const aggregateResult = {}
    const doRead = iterateIndex(
        item => {
            applyItemToAggregateResult(
                index, aggregateResult, item
            );
            return CONTINUE_READING_RECORDS;
        },
        () => aggregateResult
    );

    return await doRead(heirarchy, datastore, index, indexedDataKey);
};

export const getIndexedDataKey_fromIndexKey = (indexKey, record) => {
    return `${indexKey}${indexKey.endsWith(".csv") ? "" : ".csv"}`;
}

export const uniqueIndexName = (index) => 
    "idx_" +
    getHashCode(`${index.filter}${index.map}`) +
    ".csv";

export const getIndexedDataKey = (decendantKey, indexNode) => {

    if(isGlobalIndex(indexNode))
        return `${indexNode.nodeKey()}.csv`

    const indexedDataParentKey = 
            getActualKeyOfParent(
                indexNode.parent().nodeKey()    
                ,decendantKey);

    const indexName = 
        indexNode.name 
        ? `${indexNode.name}.csv`
        : uniqueIndexName(indexNode);

    return joinKey(
        indexedDataParentKey,
        indexName
    );
}

const applyItemToAggregateResult = (indexNode, result, item) => {
    
    const getInitialAggregateResult = () => ({
        sum: 0, mean: null, max: null, min: null
    });

    const applyAggregateResult = (agg, existing, count) => {
        const value = compileCode(agg.aggregatedValue)
                                 ({record:item});
        
        if(!isNumber(value)) return existing;

        existing.sum = existing.sum + value;
        existing.max = value > existing.max || existing.max === null
                       ? value 
                       : existing.max;
        existing.min = value < existing.min || existing.min === null
                       ? value
                       : existing.min;
        existing.mean = existing.sum / count;
        return existing;
    };

    for(let aggGroup of indexNode.aggregateGroups) {  

        if(!has(aggGroup.name)(result)) {
            result[aggGroup.name] = {}
        };

        const thisGroupResult = result[aggGroup.name];

        if(isNonEmptyString(aggGroup.condition)) {
            if(!compileExpression(aggGroup.condition)
                                 ({record:item})) {
                continue;
            }
        }

        let group = isNonEmptyString(aggGroup.groupBy)
                      ? compileCode(aggGroup.groupBy)
                                   ({record:item})
                      : "all";
        if(!isNonEmptyString(group)) {
            group = "(none)";
        }
        
        if(!has(group)(thisGroupResult)) {
            thisGroupResult[group] = {count:0};
            for(let agg of aggGroup.aggregates) {
                thisGroupResult[group][agg.name] = 
                    getInitialAggregateResult();
            } 
        }

        thisGroupResult[group].count++;

        for(let agg of aggGroup.aggregates) {
            const existingValues = thisGroupResult[group][agg.name];
            thisGroupResult[group][agg.name] = 
                applyAggregateResult(
                    agg, existingValues,
                    thisGroupResult[group].count);
        }
    }
};

const iterateIndex = (onGetItem, getFinalResult) => async (heirarchy, datastore, index, indexedDataKey) => {
    try {
        const readableStream = await datastore.readableFileStream(indexedDataKey);
        const read = getIndexReader(heirarchy, index, () => readableStream.read());
        read(onGetItem);
        return getFinalResult();
    } catch(e) {
        if(await datastore.exists(indexedDataKey)) {
            throw e;
        } else {
            await createIndexFile(datastore)(
                indexedDataKey, 
                index
            );
        }
        return [];
    }
}
