import {switchCase, defaultCase, joinKey, 
    $, isNothing, isSomething} from "../common";
import {each, constant, filter, find} from "lodash";
import {isCollection, isIndex, isRoot
    , isRecord, isaggregateGroup, getFlattenedHierarchy} from "./heirarchy";
import {all} from "../types";

export const createNodeErrors = {
    indexCannotBeParent : "Index template cannot be a parent",
    allNonRootNodesMustHaveParent: "Only the root node may have no parent",
    indexParentMustBeCollectionOrRoot: "An index may only have a collection or root as a parent",
    aggregateParentMustBeAnIndex: "aggregateGroup parent must be an index"
};

const pathRegxMaker = (node) => () => 
  node.nodeKey().replace(/{id}/g, "[a-zA-Z0-9_\-]+");

const nodeKeyMaker = (node) => () => {
    
    const parentNodeKeyPlus = (additional) => {
        return joinKey(node.parent().nodeKey(),additional);
    };

    return switchCase(

        [n => isRecord(n) && isCollection(n.parent()),
         n => parentNodeKeyPlus(n.recordNodeId + "-{id}")],
        
        [isRoot,
         constant("/")],

        [defaultCase,
         n => parentNodeKeyPlus(n.name)]
         
    )(node);
};

const validate = parent => node => {

    if(isIndex(node) 
        && isSomething(parent) 
        && !isCollection(parent)
        && !isRoot(parent)
        && !isRecord(parent)) {
        throw new Error(createNodeErrors.indexParentMustBeCollectionOrRoot);
    }

    if(isaggregateGroup(node) 
        && isSomething(parent) 
        && !isIndex(parent)) {
        throw new Error(createNodeErrors.aggregateParentMustBeAnIndex);
    }

    if(isNothing(parent) && !isRoot(node))
        throw new Error(createNodeErrors.allNonRootNodesMustHaveParent);
    
    return node;
};

const construct = (parent) => (node) => {
    
    node.nodeKey = nodeKeyMaker(node);
    node.pathRegx = pathRegxMaker(node);    
    node.parent = constant(parent);
    node.isRoot = () => isNothing(parent) 
                        && node.name === "root"
                        && node.type === "root"
    return node;
};

const addToParent = obj => {
    const parent = obj.parent();
    if(isSomething(parent)) {
        if(isIndex(obj))
            // Q: why are indexes not children ?
            // A: because they cannot have children of their own.
            parent.indexes.push(obj);
        else if(isaggregateGroup(obj))
            parent.aggregateGroups.push(obj);
        else
            parent.children.push(obj);

        if(isCollection(parent) && isRecord(obj)) {
            const defaultIndex = find(
                parent.indexes, 
                i => i.name === "default");
            if(!!defaultIndex) {
                defaultIndex.allowedRecordNodeIds.push(obj.recordNodeId);
            } 
        }
    }
    return obj;
};

const constructNode = (parent, obj) =>
    $(obj, [
        construct(parent),
        validate(parent),
        addToParent
    ]);

const getRecordNodeId = (parentNode) => {
    // this case is handled better elsewhere 
    if(!parentNode) return null;
    const findRoot = n => isRoot(n) ? n : findRoot(n.parent());
    const root = findRoot(parentNode);
    
    const records = filter(
        getFlattenedHierarchy(root),
        isRecord);

    return records.length;    
}

export const constructHeirarchy = (node, parent) => {
    construct(parent)(node);
    if(node.indexes) {
        each(node.indexes, 
            child => constructHeirarchy(child, node));
    }
    if(node.aggregateGroups) {
        each(node.aggregateGroups, 
            child => constructHeirarchy(child, node));
    }
    if(node.children && node.children.length > 0) {
        each(node.children, 
            child => constructHeirarchy(child, node));
    }
    if(node.fields) {
        each(node.fields, 
            f => each(f.typeOptions, (val, key) => 
                    f.typeOptions[key] = all[f.type]
                                         .optionDefinitions[key]
                                         .parse(val))
        );
    }
    return node;
};


export const getNewRootLevel = () => 
    construct()({
        name:"root",
        type:"root",
        children:[],
        pathMaps:[],
        indexes:[]
    });

export const getNewRecordTemplate = parent => 
    constructNode(parent, {
        name:"", 
        type: "record",
        fields:[], 
        children:[],  
        validationRules:[],
        recordNodeId: getRecordNodeId(parent),
        indexes: []
    });

export const getNewCollectionTemplate = parent => {
    const collection = constructNode(parent, {
        name:"",
        type:"collection",
        indexes: [],
        children:[],
        allidsShardFactor: isRecord(parent) ? 1 : 64
    });
    const defaultIndex = getNewIndexTemplate(collection);
    defaultIndex.name = "default";
    return collection;
};

export const getNewIndexTemplate = parent => 
    constructNode(parent, {
        name:"",
        type:"index",
        map:"return {...record};",
        filter:"",
        indexType: isRecord(parent) 
                   ? "reference" 
                   : "heirarchal",
        getShardName: "",
        getSortKey: "record.id",
        aggregateGroups: [],
        allowedRecordNodeIds: []
    });

export const getNewAggregateGroupTemplate = index => 
    constructNode(index, {
        name: "",
        type:"aggregateGroup",
        groupBy: "",
        aggregates: [],
        condition: ""
    });

export const getNewAggregateTemplate = set => {
    const aggregatedValue = {
        name: "",
        aggregatedValue: ""
    };
    set.aggregates.push(aggregatedValue);
    return aggregatedValue;
};

export default {
    getNewRootLevel, getNewRecordTemplate,  
    getNewIndexTemplate, getNewCollectionTemplate, createNodeErrors,
    constructHeirarchy, getNewAggregateGroupTemplate,
    getNewAggregateTemplate};
