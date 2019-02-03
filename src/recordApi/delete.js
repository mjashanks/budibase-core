import {safeKey, apiWrapper, isSomething, 
    events, joinKey, $} from "../common";
import {load, getRecordFileName} from "./load";
import {deleteCollection} from "../collectionApi/delete";
import {getExactNodeForPath, 
        getFlattenedHierarchy, getNode,
        fieldReversesReferenceToNode} from "../templateApi/heirarchy";
import {map, flatten, filter} from "lodash/fp";
import {deleteIndex} from "../indexApi/delete";
import {transactionForDeleteRecord} from "../transactions/create";
import {removeFromAllIds} from "../indexing/allIds";

export const deleteRecord = (app, indexingApi) => async (key) => 
    apiWrapper(
        app,
        events.recordApi.delete, 
        {key},
        _deleteRecord, app, indexingApi, key);

// called deleteRecord because delete is a keyword
const _deleteRecord = async (app, indexingApi, key) => { 
    key = safeKey(key);
    const node = getExactNodeForPath(app.heirarchy)(key);
    
    const record = await load(app)(key);
    await transactionForDeleteRecord(app, record);

    
    for(let collection of node.children) {
        const collectionKey = joinKey(
            key, collection.name
        );
        await deleteCollection(app)(collectionKey);
    }

    
    await app.datastore.deleteFile(
        getRecordFileName(key));
    await removeFromAllIds(app.heirarchy, app.datastore)(record);
    
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