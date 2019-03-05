import {permission} from "./permissions";
import {getFlattenedHierarchy, 
    isIndex, isRecord} from "../templateApi/heirarchy";
import {filter, values, each} from "lodash/fp";
import {$} from "../common";

export const generateFullPermissions = app => {

    const allNodes = getFlattenedHierarchy(app.heirarchy);
    const accessLevel = {permissions:[]};

    const recordNodes = $(allNodes, [
        filter(isRecord)
    ]);

    for(let n of recordNodes) {
        permission.createRecord.add(n.nodeKey(), accessLevel);
        permission.updateRecord.add(n.nodeKey(), accessLevel);
        permission.deleteRecord.add(n.nodeKey(), accessLevel);
        permission.readRecord.add(n.nodeKey(), accessLevel);
    }

    const indexNodes = $(allNodes, [
        filter(isIndex)
    ]);

    for(let n of indexNodes) {
        permission.readIndex.add(n.nodeKey(), accessLevel);
    }

    $(permission, [
        values,
        filter(p => !p.isNode),
        each(p => p.add(accessLevel))
    ]);

    return accessLevel.permissions;
};