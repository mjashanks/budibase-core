import {apiWrapperSync, events} from "../common";
import {permission} from "./permissions";

export const getNewAccessLevel = app => () => 
    apiWrapperSync(
        app,
        events.authApi.getNewAccessLevel, 
        permission.writeAccessLevels.isAuthorized,
        {},
        _getNewAccessLevel, app);

export const _getNewAccessLevel = () => ({
    name:"",
    permissions: []
});

