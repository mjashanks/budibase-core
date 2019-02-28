import {permissionTypes} from "./authCommon";
import {keys, includes, some} from "lodash/fp";
import {$, isNothing} from "../common";
import {getExactNodeForPath} from "../templateApi/heirarchy";

export const isAuthorized = app => resource => {
    
    if(!app.user) {
        return false;
    }

    const validType = $(permissionTypes, [
        keys,
        includes(resource.type)
    ]);

    if(!validType) {
        return false;
    }

    const permMatchesResource = perm => 
        (p.type === resource.type)
        &&
        (
            isNothing(resource.itemKey)
            ||
            $(resource.itemKey, [
                getExactNodeForPath(app),
                n => n.nodeKey === perm.nodeKey
            ])
        );    

    return $(app.user.permissions, [
        some(permMatchesResource)
    ]);
    
};