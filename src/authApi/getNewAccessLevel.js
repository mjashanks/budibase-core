import {WHITELIST, permissionTypes} from "./authCommon";

export const getNewAccessLevel = app => () => ({
    name:"",
    accessType: WHITELIST,
    permissions: []
});

const nodePermission = (accessLevel, type, nodeKey) => {
    accessLevel.permissions.push({type, nodeKey});
};

const staticPermission = (accessLevel, type) => 
    accessLevel.permissions.push({type});

export const createRecordPermission = (accessLevel, recordNodeKey) =>
    nodePermission(accessLevel, recordNodeKey, permissionTypes.CREATE_RECORD);

export const updateRecordPermission = (accessLevel, recordNodeKey) =>
    nodePermission(accessLevel, recordNodeKey, permissionTypes.UPDATE_RECORD);

export const deleteRecordPermission = (accessLevel, recordNodeKey) =>
    nodePermission(accessLevel, recordNodeKey, permissionTypes.DELETE_RECORD);

export const readRecordPermission = (accessLevel, recordNodeKey) =>
    nodePermission(accessLevel, recordNodeKey, permissionTypes.READ_RECORD);

export const writeTemplatesPermission = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.WRITE_TEMPLATES);

export const createUserPermission = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.CREATE_USER);

export const setPasswordPermission = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.SET_PASSWORD);

export const readIndexPermission = (indexNodeKey) =>
    nodePermission(accessLevel, indexNodeKey, permissionTypes.READ_INDEX);

export const createTemporaryAccessPermission = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.CREATE_TEMPORARY_ACCESS);

export const enableDisableUserPermission = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.ENABLE_DISABLE_USER);

export const writeAccessLevelsPermission = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.WRITE_ACCESS_LEVELS);

export const listUsersPermission = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.LIST_USERS);

export const listAccessLevelsPermission = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.LIST_ACCESS_LEVELS);