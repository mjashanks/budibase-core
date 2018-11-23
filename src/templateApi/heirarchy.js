import {find, constant, map,
        take, union, includes} from "lodash/fp";
import {$, switchCase, isNothing, isSomething,
    defaultCase, splitKey, joinKey} from "../common";

export const getFlattenedHierarchy = appHeirarchy => {

    if(isSomething(appHeirarchy.getFlattenedHeirarchy))
        return appHeirarchy.getFlattenedHeirarchy();

    const flattenHeirarchy = (currentNode, flattened) => {
        flattened.push(currentNode);
        if(!currentNode.children 
            || currentNode.children.length == 0){
            return flattened;
        }
        const children = 
            currentNode.indexes 
            ? union(currentNode.children)(currentNode.indexes)
            : currentNode.children;

        for(let child of children) {
            flattenHeirarchy(child, flattened);
        }
        return flattened;
    };

    appHeirarchy.getFlattenedHeirarchy = () => flattenHeirarchy(appHeirarchy, []);
    return appHeirarchy.getFlattenedHeirarchy();

};

export const getNodesInPath = appHeirarchy => key => 
    $(appHeirarchy, [
        getFlattenedHierarchy,
        filter(n => new RegExp(`${n.pathRegx()}`).test(key))
    ]);

export const getExactNodeForPath = appHeirarchy => key => 
    $(appHeirarchy, [
        getFlattenedHierarchy,
        find(n => new RegExp(`${n.pathRegx()}$`).test(key))
    ]);

export const hasMatchingAncestor = ancestorPredicate => decendantNode =>
    switchCase(
        
        [node => isNothing(node.parent()), 
        constant(false)],

        [node => ancestorPredicate(node.parent()), 
        constant(true)],

        [defaultCase, 
        node => hasMatchingAncestor(ancestorPredicate)(node.parent())]

    )(decendantNode);

export const getNode = (appHeirarchy, nodeKey) =>
    $(appHeirarchy, [
        getFlattenedHierarchy,
        find(n => n.nodeKey() === nodeKey)
    ]);

export const getNodeByKeyOrNodeKey = (appHeirarchy, keyOrNodeKey) => {
    const nodeByKey = getExactNodeForPath(appHeirarchy)(keyOrNodeKey);
    return isNothing(nodeByKey)
           ? getNode(appHeirarchy, keyOrNodeKey)
           : nodeByKey;
}

export const isNode = (appHeirarchy, key) => 
    isNothing(getExactNodeForPath(appHeirarchy)(key))

export const getActualKeyOfParent = (parentNodeKey, actualChildKey) => 
    $(actualChildKey, [
        splitKey,
        take(splitKey(parentNodeKey).length),
        ks => joinKey(...ks)
    ]);

export const getParentKey = key => {
    const split = splitKey(key);
    const taken = take(splitKey(key).length - 1)(split);
    const joined = joinKey(...taken);
    return $(key, [
        splitKey,
        take(splitKey(key).length - 1),
        joinKey
    ]);
}

export const isKeyAncestorOf = ancestorKey => decendantNode =>
    hasMatchingAncestor(p => p.nodeKey() === ancestorKey)(decendantNode);

export const hasNoMatchingAncestors = parentPredicate => node => 
    !hasMatchingAncestor(parentPredicate)(node);
    
export const findField = (recordNode, fieldName) => 
    find(f => f.name == fieldName)(recordNode.fields);

export const isAncestor = decendant => ancestor =>
    isKeyAncestorOf(ancestor.nodeKey())(decendant);
    
    
export const isRecord = node => isSomething(node) && node.type === "record";
export const isCollection = node => isSomething(node) && node.type === "collection";
export const isIndex = node => isSomething(node) && node.type === "index";
export const isRoot = node => isSomething(node) && node.isRoot();
export const isDecendantOfARecord = hasMatchingAncestor(isRecord)
export const isGlobalIndex = node => 
    isIndex(node) && isRoot(node.parent()); 
export const isTopLevelCollection = node => 
    isCollection(node)
    && !isDecendantOfARecord(node);

export const fieldReversesReferenceToNode = node => field => 
    field.type === "reference"
    && isSomething(field.typeOptions.reverseIndexNodeKey)
    && includes(field.typeOptions.reverseIndexNodeKey)
            (map(i => i.nodeKey())(node.indexes));
