import {getFlattenedHierarchy} from "../templateApi/heirarchy";
import {$, splitKey, joinKey} from "../common";
import {find, take, union} from "lodash/fp";

export const customId = app => (nodeName, id) => {
    var node = $(app.heirarchy, [
        getFlattenedHierarchy,
        find(n => n.name === nodeName)
    ]);

    if(!node) throw new Error("Cannot find node " + nodeName);

    return `${node.nodeId}-${id}`;
}

export const setCustomId = app => (record, id) => {
    record.id = customId(app)(record.type, id);

    const keyParts = splitKey(record.key);

    record.key = $(keyParts, [
        take(keyParts.length - 1),
        union([record.id]),
        joinKey
    ])

    return record;
}