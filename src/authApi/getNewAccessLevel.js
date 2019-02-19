import {WHITELIST, CREATE_RECORD, UPDATE_RECORD, DELETE_RECORD, READ_RECORD, READ_INDEX} from "./authCommon";

export const getNewAccessLevel = app => () => ({
    name:"",
    accessType: WHITELIST,
    resources: []
});

const addNodeResource = (accessLevel, type, nodeKey) => {
    accessLevel.push({type, nodeKey});
};

const addStaticResource = type => 
    accessLevel.push({type});

export const createRecordResource = (recordNodeKey) =>
    addNodeResource(recordNodeKey, CREATE_RECORD);

export const updateRecordResource = (recordNodeKey) =>
    addNodeResource(recordNodeKey, UPDATE_RECORD);

export const deleteRecordResource = (recordNodeKey) =>
    addNodeResource(recordNodeKey, DELETE_RECORD);

export const readRecordResource = (recordNodeKey) =>
    addNodeResource(recordNodeKey, READ_RECORD);

export const readIndexResource = (indexNodeKey) =>
    addNodeResource(indexNodeKey, READ_INDEX);

