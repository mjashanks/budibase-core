import {joinKey, splitKey, 
    isNothing, $} from "../common";
import {orderBy, constant} from "lodash";
import {reduce, find, 
        filter, each, map} from "lodash/fp";
import {getFlattenedHierarchy, isView, 
        isCollection} from "../templateApi/heirarchy";

export const getRelevantIndexes = (appHeirarchy, key) => {

    const pathParts = splitKey(key);

    const flatHeirarchy = 
        orderBy(getFlattenedHierarchy(appHeirarchy),
                [node => node.pathRegx().length],
                ["desc"]);

    const makeViewNodeAndPath = (viewNode, path) => ({viewNode, path});
    const makeViewNodeKeyAndPath_ForCollectionView = (viewNode, path) => 
        makeViewNodeAndPath(viewNode, joinKey(path, viewNode.name));

    const traverseHeirarchyCollectionViewIndexesInPath = () => 
        reduce((acc, part) => {
            const currentPath = joinKey(acc.lastPath, part);
            acc.lastPath = currentPath;
            const testPathRegx = p => 
                new RegExp(`${p.pathRegx()}$`).test(currentPath);
            const nodeMatch = find(testPathRegx)(flatHeirarchy)               

            if(isNothing(nodeMatch)) 
                return acc;
            
            if(!isCollection(nodeMatch) || nodeMatch.views.length === 0)
                return acc;

            each(v => 
                acc.nodesAndPaths.push(
                    makeViewNodeKeyAndPath_ForCollectionView(v, currentPath)))
            (nodeMatch.views);

            return acc;             
        }, {lastPath:"", nodesAndPaths:[]})
        (pathParts).nodesAndPaths;
    
    const getGlobalViews = () => 
        // returns views that are direct children of root
        // and therefor apply globally
        $(appHeirarchy.children, [
            filter(isView),
            map(c => makeViewNodeAndPath(c, c.nodeKey()))
        ]);
    

    return ({
        globalViews: getGlobalViews(),
        collections: traverseHeirarchyCollectionViewIndexesInPath()
    });
};

export default getRelevantIndexes;
