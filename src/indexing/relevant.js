import {joinKey, splitKey, 
    isNothing, switchCase} from "../common";
import {orderBy, constant} from "lodash";
import {reduce, find, 
    reverse, each} from "lodash/fp";
import {getFlattenedHierarchy, isView, 
        isGroup, isCollection} from "../templateApi/heirarchy";

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
    
    const traverseHeirarchyForGlobalViews = () => {
        // returns views who only have Group parents in heirarchy
        // and therefor apply globally
        const allParentsAreGroups = 
            switchCase(
                [n => isNothing(n.parent()), 
                constant(true)],
                
                [n => !isGroup(n.parent()), 
                constant(false)],
                
                [n => isGroup(n.parent()), 
                n => allParentsAreGroups(n.parent())]
            );
                    
        return reduce((views, currentNode) => {
            if(isView(currentNode)
               && allParentsAreGroups(currentNode)) {
                views.push(
                    makeViewNodeAndPath(currentNode, currentNode.nodeKey()));
            }
            return views;
        }, [])
        (reverse(flatHeirarchy)); //shortest path first
    };

    return ({
        globalViews: traverseHeirarchyForGlobalViews(),
        collections: traverseHeirarchyCollectionViewIndexesInPath()
    });
};

export default getRelevantIndexes;
