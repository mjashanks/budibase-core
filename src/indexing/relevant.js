import {joinKey, splitKey, 
    isNothing, $, isSomething} from "../common";
import {orderBy, constant} from "lodash";
import {reduce, find, 
        filter, each, map} from "lodash/fp";
import {getFlattenedHierarchy, isIndex, 
        isCollection, getNode,
        getExactNodeForPath} from "../templateApi/heirarchy";

export const getRelevantIndexes = (appHeirarchy, record) => {

    const key = record.key();
    const pathParts = splitKey(key);

    const flatHeirarchy = 
        orderBy(getFlattenedHierarchy(appHeirarchy),
                [node => node.pathRegx().length],
                ["desc"]);

    const makeIndexNodeAndPath = (indexNode, path) => ({indexNode, path});
    const makeindexNodeKeyAndPath_ForCollectionIndex = (indexNode, path) => 
        makeIndexNodeAndPath(indexNode, joinKey(path, indexNode.name));

    const traverseHeirarchyCollectionIndexesInPath = () => 
        reduce((acc, part) => {
            const currentPath = joinKey(acc.lastPath, part);
            acc.lastPath = currentPath;
            const testPathRegx = p => 
                new RegExp(`${p.pathRegx()}$`).test(currentPath);
            const nodeMatch = find(testPathRegx)(flatHeirarchy)               

            if(isNothing(nodeMatch)) 
                return acc;
            
            if(!isCollection(nodeMatch) || nodeMatch.indexes.length === 0)
                return acc;

            each(v => 
                acc.nodesAndPaths.push(
                    makeindexNodeKeyAndPath_ForCollectionIndex(v, currentPath)))
            (nodeMatch.indexes);

            return acc;             
        }, {lastPath:"", nodesAndPaths:[]})
        (pathParts).nodesAndPaths;
    
    const getGlobalIndexes = () => 
        // returns indexes that are direct children of root
        // and therefor apply globally
        $(appHeirarchy.indexes, [
            filter(isIndex),
            map(c => makeIndexNodeAndPath(c, c.nodeKey()))
        ]);
    
    const getReverseReferenceIndexes = () => 
        $(key, [
            getExactNodeForPath(appHeirarchy),
            n => n.fields,
            filter(f => f.type === "reference"
                        && isSomething(f.typeOptions.reverseIndexNodeKey)
                        && isSomething(record[f.name])
                        && record[f.name].key),
            map(f => {
                const revIndexNode = getNode(
                                        appHeirarchy,
                                        f.typeOptions.reverseIndexNodeKey
                                    );
                const indexPath = joinKey(
                    record[f.name].key, revIndexNode.name);
                return makeIndexNodeAndPath(revIndexNode, indexPath);
            }),
        ]);
    

    return ({
        globalIndexes: getGlobalIndexes(),
        collections: traverseHeirarchyCollectionIndexesInPath(),
        reverseReference: getReverseReferenceIndexes()
    });
};

export default getRelevantIndexes;
