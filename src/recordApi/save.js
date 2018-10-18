import {cloneDeep} from "lodash/fp";
import {initialiseChildCollections} from "../collectionApi/initialise";
import {validate} from "./validate";

export const save = (app,indexingApi) => async (record, context) => {
    const recordClone = cloneDeep(record);
    const validationResult = validate(app)
                                     (recordClone, context);
    if(!validationResult.isValid) {
        throw new Error("Save : Record Invalid : " + JSON.stringify(validationResult.errors));
    }

    recordClone.type = record.type();
    if(recordClone.isNew()) {
        await app.datastore.createJson(recordClone.key(), recordClone);
        await initialiseChildCollections(app, recordClone.key());
        await indexingApi.reindexForCreate(recordClone);
    }
    else {
        const oldRecord = await app.datastore.loadJson(recordClone.key());
        await app.datastore.updateJson(recordClone.key(), recordClone);
        await indexingApi.reindexForUpdate(oldRecord, recordClone);
    }
};
