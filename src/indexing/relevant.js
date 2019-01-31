import {joinKey, splitKey, isNonEmptyString,
    isNothing, $, isSomething} from "../common";
import {orderBy, constant} from "lodash";
import {reduce, find, includes, flatten,
        filter, each, map} from "lodash/fp";
import {getFlattenedHierarchy, isIndex, 
        isCollection, getNode, getRecordNodeId,
        getExactNodeForPath} from "../templateApi/heirarchy";

export const getRelevantHeirarchalIndexes = (appHeirarchy, record) => {

    const key = record.key();
    const keyParts = splitKey(key);
    const recordNodeId = getRecordNodeId(key);

    const flatHeirarchy = 
        orderBy(getFlattenedHierarchy(appHeirarchy),
                [node => node.pathRegx().length],
                ["desc"]);

    const makeindexNodeAndKey_ForCollectionIndex = (indexNode, indexKey) => 
        makeIndexNodeAndKey(indexNode, joinKey(indexKey, indexNode.name));

    const traverseHeirarchyCollectionIndexesInPath = () => 
        reduce((acc, part) => {
            const currentIndexKey = joinKey(acc.lastIndexKey, part);
            acc.lastIndexKey = currentIndexKey;
            const testPathRegx = p => 
                new RegExp(`${p.pathRegx()}$`).test(currentIndexKey);
            const nodeMatch = find(testPathRegx)(flatHeirarchy)               

            if(isNothing(nodeMatch)) 
                return acc;
            
            if(!isCollection(nodeMatch) || nodeMatch.indexes.length === 0)
                return acc;
            
            const indexes = $(nodeMatch.indexes, [
                filter(i => i.allowedRecordNodeIds.length === 0
                         || includes(recordNodeId)(i.allowedRecordNodeIds))
            ]);

            each(v => 
                acc.nodesAndKeys.push(
                    makeindexNodeAndKey_ForCollectionIndex(v, currentIndexKey)))
            (indexes);

            return acc;             
        }, {lastIndexKey:"", nodesAndKeys:[]})
        (keyParts).nodesAndKeys;
    
    const getGlobalIndexes = () => 
        // returns indexes that are direct children of root
        // and therefor apply globally
        $(appHeirarchy.indexes, [
            filter(isIndex),
            map(c => makeIndexNodeAndKey(c, c.nodeKey()))
        ]);
    
    return ({
        globalIndexes: getGlobalIndexes(),
        collections: traverseHeirarchyCollectionIndexesInPath()
    });
};

export const getRelevantReverseReferenceIndexes = (appHeirarchy, record) => 
    $(record.key(), [
        getExactNodeForPath(appHeirarchy),
        n => n.fields,
        filter(f => f.type === "reference"
                    && isSomething(record[f.name])
                    && isNonEmptyString(record[f.name].key)),
        map(f => $(f.typeOptions.reverseIndexNodeKeys,[
                    map(n => ({recordNode: getNode(appHeirarchy,n),
                             field:f}))
                 ])),
        flatten,
        map(n => makeIndexNodeAndKey(
            n.recordNode, 
            joinKey(record[n.field.name].key, n.recordNode.name))),
    ]);

const makeIndexNodeAndKey = (indexNode, indexKey) => ({indexNode, indexKey});

export default getRelevantHeirarchalIndexes;
