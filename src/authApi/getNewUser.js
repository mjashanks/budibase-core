import {apiWrapper, events} from "../common";

export const getNewUser = app => () => 
    apiWrapper(
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
    apiWrapper(
        app,
        events.authApi.getNewUserAuth, 
        {},
        _getNewUserAuth, app);

export const _getNewUserAuth = app => ({
    passwordHash: "",
    temporaryAccessHash: "",
    temporaryAccessExpiryEpoch: 0
});