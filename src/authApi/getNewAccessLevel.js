import {WHITELIST, PermissionTypes} from "./authCommon";

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
    nodePermission(recordNodeKey, PermissionTypes.CREATE_RECORD);

export const updateRecordPermission = (recordNodeKey) =>
    nodePermission(recordNodeKey, PermissionTypes.UPDATE_RECORD);

export const deleteRecordPermission = (recordNodeKey) =>
    nodePermission(recordNodeKey, PermissionTypes.DELETE_RECORD);

export const readRecordPermission = (recordNodeKey) =>
    nodePermission(recordNodeKey, PermissionTypes.READ_RECORD);

export const writeTemplatesPermission = () =>
    staticPermission(PermissionTypes.WRITE_TEMPLATES);

export const createUserPermission = () =>
    staticPermission(PermissionTypes.CREATE_USER);

export const setPasswordPermission = () =>
    staticPermission(PermissionTypes.SET_PASSWORD);

export const readIndexPermission = (indexNodeKey) =>
    nodePermission(indexNodeKey, PermissionTypes.READ_INDEX);

export const createTemporaryAccessPermission = () =>
    staticPermission(PermissionTypes.CREATE_TEMPORARY_ACCESS);

export const enableDisableUserPermission = () =>
    staticPermission(PermissionTypes.ENABLE_DISABLE_USER);

export const writeAccessLevelsPermission = () =>
    staticPermission(PermissionTypes.WRITE_ACCESS_LEVELS);

export const listUsersPermission = () =>
    staticPermission(PermissionTypes.LIST_USERS);

export const listAccessLevelsPermission = () =>
    staticPermission(PermissionTypes.LIST_ACCESS_LEVELS);