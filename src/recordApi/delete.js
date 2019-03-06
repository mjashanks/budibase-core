import {safeKey, apiWrapper, isSomething, 
    events, joinKey, $} from "../common";
import {load, getRecordFileName} from "./load";
import {_deleteCollection} from "../collectionApi/delete";
import {getExactNodeForPath, 
        getFlattenedHierarchy, getNode,
        fieldReversesReferenceToNode} from "../templateApi/heirarchy";
import {map, flatten, filter} from "lodash/fp";
import {deleteIndex} from "../indexApi/delete";
import {transactionForDeleteRecord} from "../transactions/create";
import {removeFromAllIds} from "../indexing/allIds";
import {permission} from "../authApi/permissions";

export const deleteRecord = (app, disableCleanup=false) => async (key) => 
    apiWrapper(
        app,
        events.recordApi.delete, 
        permission.deleteRecord.isAuthorized(key),
        {key},
        _deleteRecord, app, key, disableCleanup);

// called deleteRecord because delete is a keyword
const _deleteRecord = async (app, key, disableCleanup) => { 
    key = safeKey(key);
    const node = getExactNodeForPath(app.heirarchy)(key);
    
    const record = await load(app)(key);
    await transactionForDeleteRecord(app, record);

    
    for(let collection of node.children) {
        const collectionKey = joinKey(
            key, collection.name
        );
        await _deleteCollection(app, collectionKey, true);
    }

    
    await app.datastore.deleteFile(
        getRecordFileName(key));
    await removeFromAllIds(app.heirarchy, app.datastore)(record);
    
    if(!disableCleanup)
        await app.cleanupTransactions();
        
    await app.datastore.deleteFolder(key);
    await deleteIndexes(app, key)
};

const deleteIndexes = async (app, key) => {
    const node = getExactNodeForPath(app.heirarchy)
                                    (key);
    const reverseIndexKeys = $(app.heirarchy, [
        getFlattenedHierarchy,
        map(n => n.fields),
        flatten,
        filter(isSomething),
        filter(fieldReversesReferenceToNode(node)),
        map(f => $(f.typeOptions.reverseIndexNodeKeys, [
                    map(n => getNode(
                                app.heirarchy,
                                n))
                ])
        ),
        flatten,
        map(n => joinKey(key, n.name))
    ]);

    for(let i of reverseIndexKeys) {
        await deleteIndex(app)(i);
    }
}