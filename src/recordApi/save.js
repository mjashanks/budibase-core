import {cloneDeep, constant} from "lodash/fp";
import {initialiseChildCollections} from "../collectionApi/initialise";
import {validate} from "./validate";
import {onSaveBegin, onSaveComplete,
    onRecordCreated, onRecordUpdated} from "./events";
import {load} from "./load";

export const save = (app,indexingApi) => async (record, context) => {
    const recordClone = cloneDeep(record);

    app.publish(onSaveBegin, {record:recordClone});

    const validationResult = validate(app)
                                     (recordClone, context);
    if(!validationResult.isValid) {
        app.publish(onSaveInvalid, {record,validationResult});
        throw new Error("Save : Record Invalid : " + JSON.stringify(validationResult.errors));
    }

    const returnedClone = cloneDeep(record);
    returnedClone.isNew = constant(false);

    recordClone.type = record.type();
    if(recordClone.isNew()) {
        await app.datastore.createJson(recordClone.key(), recordClone);
        await initialiseChildCollections(app, recordClone.key());
        app.publish(onRecordCreated, {record:recordClone});
        await indexingApi.reindexForCreate(recordClone);
    }
    else {
        const loadRecord = load(app);
        const oldRecord = await loadRecord(recordClone.key());
        await app.datastore.updateJson(recordClone.key(), recordClone);
        
        app.publish(onRecordUpdated, {
            old:oldRecord,
            new:returnedClone
        });
        
        await indexingApi.reindexForUpdate(oldRecord, recordClone);
    }
   
    app.publish(onSaveComplete, {record:returnedClone});
    return returnedClone;
};
