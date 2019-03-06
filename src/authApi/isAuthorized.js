import {permissionTypes} from "./authCommon";
import {values, includes, some} from "lodash/fp";
import {$, isNothing, apiWrapperSync, events} from "../common";
import {getNodeByKeyOrNodeKey} from "../templateApi/heirarchy";
import {alwaysAuthorized} from "./permissions";

export const isAuthorized = (app) => (permissionType, resourceKey) => 
    apiWrapperSync(
        app,
        events.authApi.isAuthorized, 
        alwaysAuthorized,
        {resourceKey, permissionType},
        _isAuthorized, app, permissionType, resourceKey);

export const _isAuthorized =  (app, permissionType, resourceKey) => {
    
    if(!app.user) {
        return false;
    }

    const validType = $(permissionTypes, [
        values,
        includes(permissionType)
    ]);

    if(!validType) {
        return false;
    }

    const permMatchesResource = userperm => 
        (userperm.type === permissionType)
        &&
        (
            isNothing(resourceKey)
            ||
            getNodeByKeyOrNodeKey(
                    app.heirarchy,
                    resourceKey).nodeKey() === userperm.nodeKey
        );    

    return $(app.user.permissions, [
        some(permMatchesResource)
    ]);
    
};