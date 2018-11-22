import {getRelevantIndexes} from "./relevant";
import {mapRecord, evaluate} from "./evaluate";
import {allToAllIds, addToAllIds} from "./allIds";
import {$$} from "../common";
import {filter, map, keys, isEqual} from "lodash/fp";
import {union} from "lodash";
import {add, update, remove} from "./apply";
import {unparse} from "papaparse";

const reindexFor = async (datastore, appHeirarchy, record, forAction) =>  {

    const indexes = getRelevantIndexes(appHeirarchy, record);

    const evaluateRecord = evaluate(record);

    const getIndexNodesToApply = $$(
        map(n => ({mappedRecord:evaluateRecord(n.indexNode), 
                    indexNode:n.indexNode, 
                    path:n.path})),
        filter(n => n.mappedRecord.passedFilter)
    );

    for(let i of getIndexNodesToApply(indexes.collections)) {
        await forAction(datastore, i.indexNode, i.mappedRecord.result);
    }

    // this can definately be done in parallel (as can be in js)
    for(let i of getIndexNodesToApply(indexes.globalIndexes)) {
        await forAction(datastore, i.indexNode, i.mappedRecord.result);
    }

    for(let i of getIndexNodesToApply(indexes.reverseReference)) {
        await forAction(datastore, i.indexNode, i.mappedRecord.result);
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

    const indexes = getRelevantIndexes(appHeirarchy, newRecord);

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

    const toRemoveFilter = n => 
        n.old.mappedRecord.passedFilter === true
        && n.new.mappedRecord.passedFilter === false;

    const toAddFilter = n => 
        n.old.mappedRecord.passedFilter === false
        && n.new.mappedRecord.passedFilter === true;

    const toUpdateFilter = n => {
        return n.new.mappedRecord.passedFilter === true
        && n.old.mappedRecord.passedFilter === true
        && !isEqual(n.old.mappedRecord.result, 
                    n.new.mappedRecord.result);
        }

    // old records to remove (filtered out)
    const filteredOut_toRemove =
        union(
            getIndexNodesToApply(toRemoveFilter)(indexes.collections),
            getIndexNodesToApply(toRemoveFilter)(indexes.globalIndexes),
            getIndexNodesToApply(toRemoveFilter)(indexes.reverseReference)
        );

    // new records to add (filtered in)
    const filteredIn_toAdd =
        union(
            getIndexNodesToApply(toAddFilter)(indexes.collections),
            getIndexNodesToApply(toAddFilter)(indexes.globalIndexes)
        );

    const changed = 
        union(
            getIndexNodesToApply(toUpdateFilter)(indexes.collections),
            getIndexNodesToApply(toUpdateFilter)(indexes.globalIndexes)
        );

    for(let i of filteredOut_toRemove) {
        await remove(datastore, i.new.indexNode, i.new.mappedRecord.result);
    }

    for(let i of filteredIn_toAdd) {
        await add(datastore, i.new.indexNode, i.new.mappedRecord.result);
    }

    for(let i of changed) {
        await update(datastore, i.new.indexNode, i.new.mappedRecord.result);
    }

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

