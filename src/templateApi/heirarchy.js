import {find, constant, map, last, first, split, intersection,
        take, union, includes, filter, some} from "lodash/fp";
import {$, switchCase, isNothing, isSomething,
    defaultCase, splitKey, isNonEmptyString,
    joinKey} from "../common";

export const getFlattenedHierarchy = (appHeirarchy, useCached=true) => {

    if(isSomething(appHeirarchy.getFlattenedHeirarchy) && useCached)
        return appHeirarchy.getFlattenedHeirarchy();

    const flattenHeirarchy = (currentNode, flattened) => {
        flattened.push(currentNode);
        if((!currentNode.children 
            || currentNode.children.length === 0)
            && 
            (!currentNode.indexes
            || currentNode.indexes.length === 0)
            && 
            (!currentNode.aggregateGroups
            || currentNode.aggregateGroups.length === 0)){
            return flattened;
        }

        const unionIfAny = l2 => l1 =>
            union(l1)(!l2 ? [] : l2);

        const children = $([], [
            unionIfAny(currentNode.children),
            unionIfAny(currentNode.indexes),
            unionIfAny(currentNode.aggregateGroups)
        ]);

        for(let child of children) {
            flattenHeirarchy(child, flattened);
        }
        return flattened;
    };

    appHeirarchy.getFlattenedHeirarchy = () => flattenHeirarchy(appHeirarchy, []);
    return appHeirarchy.getFlattenedHeirarchy();

};

export const getLastPartInKey = key => 
    last(splitKey(key));

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
    
export const isDecendant = ancestor => decendant =>
    isAncestor(decendant)(ancestor);

export const getRecordNodeId = recordKey =>
    $(recordKey, [
        splitKey,
        last,
        split("-"),
        first,
        parseInt
    ]);

export const getAllowedRecordNodesForIndex = (appHeirarchy, indexNode) => {
    const recordNodes = $(appHeirarchy, [
        getFlattenedHierarchy,
        filter(isRecord)
    ]);

    const recordNodeIsAllowed = recordNode =>
        indexNode.allowedRecordNodeIds.length === 0
        || includes(recordNode.recordNodeId)(indexNode.allowedRecordNodeIds);

    if(isGlobalIndex(indexNode)) {
        return $(recordNodes, [
            filter(recordNodeIsAllowed)
        ]);
    }

    if(isCollectionIndex(indexNode)) {
        return $(recordNodes, [
            filter(isDecendant(indexNode.parent())),
            filter(recordNodeIsAllowed)
        ]);
    }

    if(isReferenceIndex(indexNode)) {
        return $(recordNodes, [
            filter(n => some(fieldReversesReferenceToIndex(indexNode))
                        (n.fields))
        ]);
    }

};
    
export const isRecord = node => isSomething(node) && node.type === "record";
export const isCollection = node => isSomething(node) && node.type === "collection";
export const isIndex = node => isSomething(node) && node.type === "index";
export const isaggregateGroup = node => isSomething(node) && node.type === "aggregateGroup"
export const isShardedIndex = node => isIndex(node) && isNonEmptyString(node.getShardName);
export const isRoot = node => isSomething(node) && node.isRoot();
export const isDecendantOfARecord = hasMatchingAncestor(isRecord)
export const isGlobalIndex = node => 
    isIndex(node) && isRoot(node.parent()); 
export const isReferenceIndex = node =>
    isIndex(node) && isRecord(node.parent());
export const isCollectionIndex = node => 
    isIndex(node) && isCollection(node.parent());
export const isTopLevelCollection = node => 
    isCollection(node)
    && !isDecendantOfARecord(node);
export const isTopLevelCollectionIndex = node => 
    isTopLevelCollection(node.parent())
    && isIndex(node); 

export const fieldReversesReferenceToNode = node => field => 
    field.type === "reference"
    && intersection(field.typeOptions.reverseIndexNodeKeys)
                   (map(i => i.nodeKey())(node.indexes))
                   .length > 0;

export const fieldReversesReferenceToIndex = indexNode => field => 
    field.type === "reference"
    && intersection(field.typeOptions.reverseIndexNodeKeys)
        ([indexNode.nodeKey()])
        .length > 0;
            