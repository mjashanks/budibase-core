import {apiWrapper, events, 
        tryAwaitOrIgnore} from "../common";
import {isIndex, isShardedIndex,
        getExactNodeForPath} from "../templateApi/heirarchy";
import {getAllShardKeys, getShardMapKey,
        getUnshardedIndexDataKey} from "../indexing/sharding";
import {permission} from "../authApi/permissions";

export const deleteIndex = (app) => async (indexKey, includeFolder=true) => 
    apiWrapper(
        app,
        events.indexApi.delete, 
        permission.manageIndex.isAuthorized,
        {indexKey},
        _deleteIndex, app, indexKey, includeFolder);

const _deleteIndex = async (app, indexKey, includeFolder) => {
    const indexNode = getExactNodeForPath(app.heirarchy)(indexKey);
    
    if(!isIndex(indexNode))
        throw new Error("Supplied key is not an index");
    
    if(isShardedIndex(indexNode)) {
        const shardKeys = await getAllShardKeys(app, indexKey);
        for(let k of shardKeys) {
            await tryAwaitOrIgnore(
                app.datastore.deleteFile(k)
            );
        }
        tryAwaitOrIgnore(
            await app.datastore.deleteFile(
                getShardMapKey(indexKey)
            )
        );
    } else {
        await tryAwaitOrIgnore(
            app.datastore.deleteFile(
                getUnshardedIndexDataKey(indexKey)
            )
        );
    }

    if(includeFolder) {
        tryAwaitOrIgnore(
            await app.datastore.deleteFolder(indexKey)
        );
    }
};
