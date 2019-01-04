import {getRelevantHeirarchalIndexes,
    getRelevantReverseReferenceIndexes} from "./relevant";
import {evaluate} from "./evaluate";
import {removeFromAllIds, addToAllIds} from "./allIds";
import {$$, $} from "../common";
import {filter, map, keys, 
        isEqual, pull} from "lodash/fp";
import {union, differenceBy, intersectionBy} from "lodash";
import {add, update, remove} from "./apply";
import {createIndexFile, getIndexedDataKey} from "./sharding";

const reindexFor = async (datastore, appHeirarchy, record, forAction) =>  {

    const heirarchal = getRelevantHeirarchalIndexes(appHeirarchy, record);
    const reverseRef = getRelevantReverseReferenceIndexes(appHeirarchy, record);

    const evaluateRecord = evaluate(record);

    const getIndexNodesToApply = $$(
        map(n => ({mappedRecord:evaluateRecord(n.indexNode), 
                    indexNode:n.indexNode, 
                    path:n.path})),
        filter(n => n.mappedRecord.passedFilter)
    );

    for(let i of getIndexNodesToApply(heirarchal.collections)) {
        await forAction(appHeirarchy, datastore, i.mappedRecord.result, i.path, i.indexNode);
    }

    // this can definately be done in parallel (as can be in js)
    for(let i of getIndexNodesToApply(heirarchal.globalIndexes)) {
        await forAction(appHeirarchy, datastore, i.mappedRecord.result, i.path, i.indexNode);
    }

    for(let i of getIndexNodesToApply(reverseRef)) {
        await forAction(appHeirarchy, datastore, i.mappedRecord.result, i.path, i.indexNode);
    }
} 

const reindexForCreate = (datastore, appHeirarchy) =>  
                         async createdRecord => 
{
    await addToAllIds(appHeirarchy, datastore)(createdRecord);
    return await reindexFor(datastore, appHeirarchy, createdRecord, add);
}

const reindexForDelete = (datastore, appHeirarchy) => 
                         async deletedRecord => 
{
    await removeFromAllIds(appHeirarchy, datastore)(deletedRecord);
    return await reindexFor(datastore, appHeirarchy, deletedRecord, remove);
}


const reindexForUpdate = (datastore, appHeirarchy) => 
                         async (oldRecord, newRecord) => {

    const heirarchal = getRelevantHeirarchalIndexes(appHeirarchy, newRecord);

    const referenceChanges = diffReverseRefForUpdate(
        appHeirarchy, oldRecord, newRecord
    );

    const evaluateIndex = (record, indexNodeAndPath) => 
        ({mappedRecord:evaluate(record)(indexNodeAndPath.indexNode), 
        indexNode:indexNodeAndPath.indexNode, 
        path:indexNodeAndPath.path});

    const getIndexNodesToApply = indexFilter => $$(
        map(n => ({
            old:evaluateIndex(oldRecord, n),
            new:evaluateIndex(newRecord, n)})),
        filter(indexFilter)
    );

    const toRemoveFilter = (n, isUnreferenced) => 
        n.old.mappedRecord.passedFilter === true
        && (n.new.mappedRecord.passedFilter === false
            || isUnreferenced);

    const toAddFilter = (n, isNewlyReferenced) => 
        (n.old.mappedRecord.passedFilter === false
        || isNewlyReferenced)
        && n.new.mappedRecord.passedFilter === true;

    const toUpdateFilter = n => 
        n.new.mappedRecord.passedFilter === true
        && n.old.mappedRecord.passedFilter === true
        && !isEqual(n.old.mappedRecord.result, 
                    n.new.mappedRecord.result);
        

    // old records to remove (filtered out)
    const filteredOut_toRemove =
        union(
            getIndexNodesToApply(toRemoveFilter)(heirarchal.collections),
            getIndexNodesToApply(toRemoveFilter)(heirarchal.globalIndexes),
            // still referenced - check filter
            getIndexNodesToApply(toRemoveFilter)(referenceChanges.notChanged),
            // un referenced - remove if in there already
            getIndexNodesToApply(n => toRemoveFilter(n,true))
                                (referenceChanges.unReferenced)
        );

    // new records to add (filtered in)
    const filteredIn_toAdd =
        union(
            getIndexNodesToApply(toAddFilter)(heirarchal.collections),
            getIndexNodesToApply(toAddFilter)(heirarchal.globalIndexes),
            // newly referenced - check filter
            getIndexNodesToApply(n => toAddFilter(n,true))
                                (referenceChanges.newlyReferenced),
            // reference unchanged - rerun filter in case something else changed
            getIndexNodesToApply(toAddFilter)(referenceChanges.notChanged),
        );

    const changed = 
        union(
            getIndexNodesToApply(toUpdateFilter)(heirarchal.collections),
            getIndexNodesToApply(toUpdateFilter)(heirarchal.globalIndexes),
            // still referenced - recheck filter
            getIndexNodesToApply(toUpdateFilter)(referenceChanges.notChanged),
        );

    // for changed - if shard key has changed, we need to  
    // remove from old and add to new
    const indexedDataKeyForResult = res => 
        getIndexedDataKey(
            res.indexNode, res.path, res.mappedRecord.result
        );

    const shardKeyChanged = $(changed,[
        filter(c => indexedDataKeyForResult(c.old) !== indexedDataKeyForResult(c.new))
    ]);

    for(let res of shardKeyChanged) {
        pull(res)(changed);
        filteredOut_toRemove.push(res);
        filteredIn_toAdd.push(res);
    }

    for(let i of filteredOut_toRemove) {
        // be sure to remove from old index path, in case shard key changed
        await remove(appHeirarchy, datastore, i.old.mappedRecord.result, i.old.path, i.new.indexNode);
    }

    for(let i of filteredIn_toAdd) {
        await add(appHeirarchy, datastore, i.new.mappedRecord.result, i.new.path, i.new.indexNode);
    }

    for(let i of changed) {
        await update(appHeirarchy, datastore, i.new.mappedRecord.result, i.new.path, i.new.indexNode);
    }
}

const diffReverseRefForUpdate = (appHeirarchy, oldRecord, newRecord) => {
    const oldIndexes = getRelevantReverseReferenceIndexes(
        appHeirarchy, oldRecord
    );
    const newIndexes = getRelevantReverseReferenceIndexes(
        appHeirarchy, newRecord
    );

    const unReferenced = differenceBy(
        oldIndexes, newIndexes,
        i => i.path
    );

    const newlyReferenced = differenceBy(
        newIndexes, oldIndexes,
        i => i.path
    );

    const notChanged =  intersectionBy(
        newIndexes, oldIndexes,
        i => i.path
    );

    return  {
        unReferenced,
        newlyReferenced,
        notChanged
    };
}

export default (app) => ({
    reindexForCreate : reindexForCreate(app.datastore, app.heirarchy), 
    reindexForDelete : reindexForDelete(app.datastore, app.heirarchy), 
    reindexForUpdate : reindexForUpdate(app.datastore, app.heirarchy), 
    createIndexFile : createIndexFile(app.datastore)
});

