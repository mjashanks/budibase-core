import {getExactNodeForPath} from "../templateApi/heirarchy";
import {safeKey, apiWrapper, 
        events, joinKey} from "../common";
import {deleteRecord} from "../recordApi/delete";
import {getAllIdsIterator, getAllIdsShardKey} from "../indexing/allIds"
import getIndexingApi from "../indexing";
import {deleteView} from "../viewApi/delete";
import {includes} from "lodash/fp";

export const deleteCollection = (app) => async key => 
    apiWrapper(
        app,
        events.collectionApi.delete, 
        {key},
        _delete, app, key);


const _delete = async (app, key) => {
    key = safeKey(key);
    const node = getExactNodeForPath(app.heirarchy)(key);
    
    await deleteRecords(app, key);
    await deleteViews(app,node, key);
    await deleteAllIdsFolders(app, node, key);
    await deleteCollectionFolder(app, key);
};

const deleteCollectionFolder = async (app, key) =>
    await app.datastore.deleteFolder(key);

const deleteViews = async (app, node, key) => {
    for(let view of node.views) {
        const viewKey = joinKey(key, view.name);
        await deleteView(app)(viewKey);
    }
};

const deleteAllIdsFolders = async (app, node, key) => {
    
    for(let child of node.children) {
        await app.datastore.deleteFolder(
            joinKey(
                key, "allids", 
                child.collectionChildId
            )
        );
    }

    await app.datastore.deleteFolder(
        joinKey(key, "allids")
    );
};

const deleteRecords = async (app, key) => {


    const deletedAllIdsShards = [];
    const deleteAllIdsShard = async recordId => {
        
        const shardKey = getAllIdsShardKey(
            app.heirarchy, key, recordId);

        if(includes(shardKey)(deletedAllIdsShards)) {
            return;
        }

        deletedAllIdsShards.push(shardKey);

        await app.datastore.deleteFile(shardKey);
    }

    const iterate = await getAllIdsIterator(app)(key);
    const indexingApi = getIndexingApi(app);

    let ids = await iterate();
    while(!ids.done) {

        if(ids.result.collectionKey === key) {
            for(let id of ids.result.ids) {
                await deleteRecord(app, indexingApi)
                                (joinKey(key, id));
                await deleteAllIdsShard(id);
            }       
        }

        ids = await iterate();
    }



};