import {WHITELIST, CREATE_RECORD, UPDATE_RECORD, DELETE_RECORD, READ_RECORD, READ_INDEX, WRITE_TEMPLATES, CREATE_USER, SET_PASSWORD} from "./authCommon";

export const getNewAccessLevel = app => () => ({
    name:"",
    accessType: WHITELIST,
    permissions: []
});

const nodePermission = (accessLevel, type, nodeKey) => {
    accessLevel.permissions.push({type, nodeKey});
};

const staticPermission = type => 
    accessLevel.push({type});

export const createRecordPermission = (recordNodeKey) =>
    nodePermission(recordNodeKey, CREATE_RECORD);

export const updateRecordPermission = (recordNodeKey) =>
    nodePermission(recordNodeKey, UPDATE_RECORD);

export const deleteRecordPermission = (recordNodeKey) =>
    nodePermission(recordNodeKey, DELETE_RECORD);

export const readRecordPermission = (recordNodeKey) =>
    nodePermission(recordNodeKey, READ_RECORD);

export const writeTemplatesPermission = () =>
    staticPermission(WRITE_TEMPLATES);

export const createUserPermission = () =>
    staticPermission(CREATE_USER);

export const setPasswordPermission = () =>
    staticPermission(SET_PASSWORD);

export const readIndexPermission = (indexNodeKey) =>
    nodePermission(indexNodeKey, READ_INDEX);

export const createTemporaryAccessPermission = () =>
    staticPermission(CREATE_TEMPORARY_ACCESS);

export const enableDisableUserPermission = () =>
    staticPermission(ENABLE_DISABLE_USER);

export const writeAccessLevelsPermission = () =>
    staticPermission(WRITE_ACCESS_LEVELS);

export const listUsersPermission = () =>
    staticPermission(LIST_USERS);

export const listAccessLevelsPermission = () =>
    staticPermission(LIST_ACCESS_LEVELS);