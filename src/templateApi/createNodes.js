import {switchCase, defaultCase, joinKey, 
    $, isNothing, isSomething} from "../common";
import {each, constant} from "lodash";
import {isCollection, isView, isRoot
    , isRecord} from "./heirarchy";
import {getNewIndex} from "./indexes";

export const createNodeErrors = {
    viewCannotBeParent : "View template cannot be a parent",
    allNonRootNodesMustHaveParent: "Only the root node may have no parent",
    viewParentMustBeCollectionOrRoot: "A view may only have a collection or root as a parent"
};

const pathRegxMaker = (node) => () => 
  node.nodeKey().replace(/{id}/g, "[a-zA-Z0-9_\-]+");

const nodeKeyMaker = (node) => () => {
    
    const parentNodeKeyPlus = (additional) => {
        return joinKey(node.parent().nodeKey(),additional);
    };

    return switchCase(

        [n => isRecord(n) && isCollection(n.parent()),
         n => parentNodeKeyPlus(n.collectionChildId + "-{id}")],
        
        [isRoot,
         constant("/")],

        [defaultCase,
         n => parentNodeKeyPlus(n.name)]
         
    )(node);
};

const validate = parent => node => {
    
    if(isSomething(parent) && isView(parent)) 
        throw new Error(createNodeErrors.viewCannotBeParent);

    if(isView(node) 
        && isSomething(parent) 
        && !isCollection(parent)
        && !isRoot(parent)) {
        throw new Error(createNodeErrors.viewParentMustBeCollectionOrRoot);
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
        if(isCollection(parent) && isView(obj))
            // Q: why are views not children ?
            // A: because they cannot have children of their own.
            parent.views.push(obj);
        else
            parent.children.push(obj);
    }
    return obj;
};

const constructNode = (parent, obj) =>
    $(obj, [
        construct(parent),
        validate(parent),
        addToParent
    ]);

export const constructHeirarchy = (node, parent) => {
    construct(parent)(node);
    if(isCollection(node)) {
        each(node.views, 
            child => constructHeirarchy(child, node));
    }
    if(node.children && node.children.length > 0) {
        each(node.children, 
            child => constructHeirarchy(child, node));
    }
    return node;
};


export const getNewRootLevel = () => 
    construct()({
        name:"root",
        type:"root",
        children:[],
        pathMaps:[]
    });

export const getNewRecordTemplate = parent => 
    constructNode(parent, {
        name:"", 
        type: "record",
        fields:[], 
        children:[],  
        validationRules:[],
        collectionChildId: isSomething(parent) 
                           && isCollection(parent)
                           ? parent.children.length
                           : 0,
        referenceIndexes: []
    });

export const getNewCollectionTemplate = parent => {
    const collection = constructNode(parent, {
        name:"",
        type:"collection",
        views: [],
        children:[],
        allidsShardFactor: isRecord(parent) ? 1 : 64
    });
    const defaultview = getNewViewTemplate(collection);
    defaultview.name = "default";
    return collection;
};

export const getNewViewTemplate = parent => 
    constructNode(parent, {
        name:"",
        type:"view",
        index:getNewIndex()
    });

export default {
    getNewRootLevel, getNewRecordTemplate,  
    getNewViewTemplate, getNewCollectionTemplate, createNodeErrors,
    constructHeirarchy};
