import {getRelevantHeirarchalIndexes,
    getRelevantReverseReferenceIndexes} from "./relevant";
import {mapRecord, evaluate} from "./evaluate";
import {allToAllIds, addToAllIds} from "./allIds";
import {$$} from "../common";
import {filter, map, keys, 
        isEqual, constant} from "lodash/fp";
import {union, differenceBy, intersectionBy} from "lodash";
import {add, update, remove} from "./apply";
import {unparse} from "papaparse";

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
        await forAction(datastore, i.mappedRecord.result, i.path);
    }

    // this can definately be done in parallel (as can be in js)
    for(let i of getIndexNodesToApply(heirarchal.globalIndexes)) {
        await forAction(datastore, i.mappedRecord.result, i.path);
    }

    for(let i of getIndexNodesToApply(reverseRef)) {
        await forAction(datastore, i.mappedRecord.result, i.path);
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
                                (referenceChanges.unReferenced),
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

    for(let i of filteredOut_toRemove) {
        await remove(datastore, i.new.mappedRecord.result, i.new.path);
    }

    for(let i of filteredIn_toAdd) {
        await add(datastore, i.new.mappedRecord.result, i.new.path);
    }

    for(let i of changed) {
        await update(datastore, i.new.mappedRecord.result, i.new.path);
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


// TODO: how does this change
const createIndexFile = (datastore) => async (indexedDataKey, index) => {
    const dummyMapped = mapRecord({}, index);
    const indexCsv_headerOnly = unparse([keys(dummyMapped)]);
    await datastore.createFile(indexedDataKey, indexCsv_headerOnly);
};


export default (app) => ({
    reindexForCreate : reindexForCreate(app.datastore, app.heirarchy), 
    reindexForDelete : reindexForDelete(app.datastore, app.heirarchy), 
    reindexForUpdate : reindexForUpdate(app.datastore, app.heirarchy), 
    createIndexFile : createIndexFile(app.datastore)
});

