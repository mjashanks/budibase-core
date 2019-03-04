import {permissionTypes} from "./authCommon";
import {apiWrapperSync, events} from "../common";

export const getNewAccessLevel = app => () => 
    apiWrapperSync(
        app,
        events.authApi.getNewAccessLevel, 
        {},
        _getNewAccessLevel, app);

export const _getNewAccessLevel = app => ({
    name:"",
    permissions: []
});

export const temporaryAccessPermissions = () =>
    ([{type:permissionTypes.SET_PASSWORD}]);

const nodePermission = (type, nodeKey) => ({
    type, nodeKey,
    add : (accessLevel) => accessLevel.permissions.push({type, nodeKey}),
    isAuthorized: (app, resourcePath=null) => true
});

const staticPermission = (type) => ({
    type,
    add : accessLevel => accessLevel.permissions.push({type})
});

const createRecord = (recordNodeKey) =>
    nodePermission(recordNodeKey, permissionTypes.CREATE_RECORD);

const updateRecord = (recordNodeKey) =>
    nodePermission(recordNodeKey, permissionTypes.UPDATE_RECORD);

const deleteRecord = (recordNodeKey) =>
    nodePermission(recordNodeKey, permissionTypes.DELETE_RECORD);

const readRecord = (recordNodeKey) =>
    nodePermission(recordNodeKey, permissionTypes.READ_RECORD);

const writeTemplates = () =>
    staticPermission(permissionTypes.WRITE_TEMPLATES);

const createUser = () =>
    staticPermission(permissionTypes.CREATE_USER);

const setPassword = () =>
    staticPermission(permissionTypes.SET_PASSWORD);

const readIndex = (indexNodeKey) =>
    nodePermission(indexNodeKey, permissionTypes.READ_INDEX);

const createTemporaryAccess = () =>
    staticPermission(permissionTypes.CREATE_TEMPORARY_ACCESS);

const enableDisableUser = () =>
    staticPermission(permissionTypes.ENABLE_DISABLE_USER);

const writeAccessLevels = () =>
    staticPermission(permissionTypes.WRITE_ACCESS_LEVELS);

const listUsers = () =>
    staticPermission(permissionTypes.LIST_USERS);

const listAccessLevels = () =>
    staticPermission(permissionTypes.LIST_ACCESS_LEVELS);

export const permission = {
    createRecord, updateRecord, deleteRecord,
    readRecord, writeTemplates, createUser,
    setPassword, readIndex, createTemporaryAccess,
    enableDisableUser, writeAccessLevels, listUsers,
    listAccessLevels
};