import {apiWrapperSync, events} from "../common";

export const getNewUser = app => () => 
    apiWrapperSync(
        app,
        events.authApi.getNewUser, 
        {},
        _getNewUser, app);

export const _getNewUser = app => ({
    name: "",
    accessLevels: [],
    enabled: true,
    temporaryAccessId: ""
});

export const getNewUserAuth = app => () => 
    apiWrapperSync(
        app,
        events.authApi.getNewUserAuth, 
        {},
        _getNewUserAuth, app);

export const _getNewUserAuth = app => ({
    passwordHash: "",
    temporaryAccessHash: "",
    temporaryAccessExpiryEpoch: 0
});