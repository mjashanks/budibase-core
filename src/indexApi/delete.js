import {apiWrapper, events, 
        tryAwaitOrIgnore} from "../common";
import {isIndex, isShardedIndex,
        getExactNodeForPath} from "../templateApi/heirarchy";
import {getAllShardKeys, getShardMapKey,
        getUnshardedIndexDataKey} from "../indexing/sharding";

export const deleteIndex = (app) => async indexKey => 
    apiWrapper(
        app,
        events.indexApi.delete, 
        {indexKey},
        _deleteIndex, app, indexKey);

const _deleteIndex = async (app, indexKey) => {
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

    tryAwaitOrIgnore(
        await app.datastore.deleteFolder(indexKey)
    );
};
