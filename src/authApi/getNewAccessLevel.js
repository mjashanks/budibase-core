import {permissionTypes} from "./authCommon";
import {apiWrapper, events} from "../common";

export const getNewAccessLevel = app => () => 
    apiWrapper(
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

const nodePermission = (accessLevel, type, nodeKey) => {
    accessLevel.permissions.push({type, nodeKey});
};

const staticPermission = (accessLevel, type) => 
    accessLevel.permissions.push({type});

const createRecord = (accessLevel, recordNodeKey) =>
    nodePermission(accessLevel, recordNodeKey, permissionTypes.CREATE_RECORD);

const updateRecord = (accessLevel, recordNodeKey) =>
    nodePermission(accessLevel, recordNodeKey, permissionTypes.UPDATE_RECORD);

const deleteRecord = (accessLevel, recordNodeKey) =>
    nodePermission(accessLevel, recordNodeKey, permissionTypes.DELETE_RECORD);

const readRecord = (accessLevel, recordNodeKey) =>
    nodePermission(accessLevel, recordNodeKey, permissionTypes.READ_RECORD);

const writeTemplates = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.WRITE_TEMPLATES);

const createUser = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.CREATE_USER);

const setPassword = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.SET_PASSWORD);

const readIndex = (indexNodeKey) =>
    nodePermission(accessLevel, indexNodeKey, permissionTypes.READ_INDEX);

const createTemporaryAccess = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.CREATE_TEMPORARY_ACCESS);

const enableDisableUser = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.ENABLE_DISABLE_USER);

const writeAccessLevels = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.WRITE_ACCESS_LEVELS);

const listUsers = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.LIST_USERS);

const listAccessLevels = (accessLevel) =>
    staticPermission(accessLevel, permissionTypes.LIST_ACCESS_LEVELS);

export const addPermission = {
    createRecord, updateRecord, deleteRecord,
    readRecord, writeTemplates, createUser,
    setPassword, readIndex, createTemporaryAccess,
    enableDisableUser, writeAccessLevels, listUsers,
    listAccessLevels
};