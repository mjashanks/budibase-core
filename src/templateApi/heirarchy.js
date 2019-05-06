import {find, constant, map, last, 
    first, split, intersection,take, 
    union, includes, filter, some} from "lodash/fp";
import {$, switchCase, isNothing, isSomething,
    defaultCase, splitKey, isNonEmptyString,
    joinKey, getHashCode} from "../common";
import { indexTypes } from "./indexes";

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

export const getNodeForCollectionPath = appHeirarchy => collectionKey => 
    $(appHeirarchy, [
        getFlattenedHierarchy,
        find(n => (isCollectionRecord(n) 
                   && new RegExp(`${n.collectionPathRegx()}$`).test(collectionKey)))
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
        find(n => n.nodeKey() === nodeKey
                  || (isCollectionRecord(n)
                      && n.collectionNodeKey() === nodeKey))
    ]);

export const getCollectionNode = (appHeirarchy, nodeKey) => 
    $(appHeirarchy, [
        getFlattenedHierarchy,
        find(n => (isCollectionRecord(n)
                    && n.collectionNodeKey() === nodeKey))
    ]);

export const getNodeByKeyOrNodeKey = (appHeirarchy, keyOrNodeKey) => {
    const nodeByKey = getExactNodeForPath(appHeirarchy)(keyOrNodeKey);
    return isNothing(nodeByKey)
           ? getNode(appHeirarchy, keyOrNodeKey)
           : nodeByKey;
}

export const getCollectionNodeByKeyOrNodeKey = (appHeirarchy, keyOrNodeKey) => {
    const nodeByKey = getNodeForCollectionPath(appHeirarchy)(keyOrNodeKey);
    return isNothing(nodeByKey)
           ? getCollectionNode(appHeirarchy, keyOrNodeKey)
           : nodeByKey;
}


export const isNode = (appHeirarchy, key) => 
    isSomething(getExactNodeForPath(appHeirarchy)(key))

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
        getRecordNodeIdFromId
    ]);

export const getRecordNodeIdFromId = recordId =>
    $(recordId, [split("-"), first, parseInt])

export const getRecordNodeById = (heirarchy, recordId) => 
    $(heirarchy, [
        getFlattenedHierarchy,
        find(n => isRecord(n) 
                    && n.nodeId === getRecordNodeIdFromId(recordId))
    ]);

export const recordNodeIdIsAllowed = (indexNode) => (nodeId) =>
    indexNode.allowedRecordNodeIds.length === 0
    || includes(nodeId)(indexNode.allowedRecordNodeIds);

export const recordNodeIsAllowed = (indexNode) => (recordNode) =>
    recordNodeIdIsAllowed(indexNode)(recordNode.nodeId);

export const getAllowedRecordNodesForIndex = (appHeirarchy, indexNode) => {
    const recordNodes = $(appHeirarchy, [
        getFlattenedHierarchy,
        filter(isRecord)
    ]);


    if(isGlobalIndex(indexNode)) {
        return $(recordNodes, [
            filter(recordNodeIsAllowed(indexNode))
        ]);
    }

    if(isAncestorIndex(indexNode)) {
        return $(recordNodes, [
            filter(isDecendant(indexNode.parent())),
            filter(recordNodeIsAllowed(indexNode))
        ]);
    }

    if(isReferenceIndex(indexNode)) {
        return $(recordNodes, [
            filter(n => some(fieldReversesReferenceToIndex(indexNode))
                        (n.fields))
        ]);
    }

};

export const getNodeFromNodeKeyHash = heirarchy => hash =>
    $(heirarchy, [
        getFlattenedHierarchy,
        find(n => getHashCode(n.nodeKey()) === hash)
    ]);
    
export const isRecord = node => isSomething(node) && node.type === "record";
export const isSingleRecord = node => isRecord(node) && node.isSingle;
export const isCollectionRecord = node => isRecord(node) && !node.isSingle;
export const isIndex = node => isSomething(node) && node.type === "index";
export const isaggregateGroup = node => isSomething(node) && node.type === "aggregateGroup"
export const isShardedIndex = node => isIndex(node) && isNonEmptyString(node.getShardName);
export const isRoot = node => isSomething(node) && node.isRoot();
export const isDecendantOfARecord = hasMatchingAncestor(isRecord)
export const isGlobalIndex = node => 
    isIndex(node) && isRoot(node.parent()); 
export const isReferenceIndex = node =>
    isIndex(node) && node.indexType === indexTypes.reference;
export const isAncestorIndex = node => 
    isIndex(node) && node.indexType === indexTypes.ancestor;

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
            
export default {
    getLastPartInKey, getNodesInPath, getExactNodeForPath, 
    hasMatchingAncestor, getNode, getNodeByKeyOrNodeKey, isNode,
    getActualKeyOfParent, getParentKey, isKeyAncestorOf, hasNoMatchingAncestors,
    findField, isAncestor, isDecendant, getRecordNodeId, getRecordNodeIdFromId,
    getRecordNodeById, recordNodeIdIsAllowed, recordNodeIsAllowed, 
    getAllowedRecordNodesForIndex, getNodeFromNodeKeyHash, isRecord,
    isCollectionRecord, isIndex, isaggregateGroup, isShardedIndex, isRoot,
    isDecendantOfARecord, isGlobalIndex, isReferenceIndex, isAncestorIndex,
    fieldReversesReferenceToNode, fieldReversesReferenceToIndex,
    getFlattenedHierarchy,
}