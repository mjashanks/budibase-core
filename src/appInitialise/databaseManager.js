import {isNothing} from "../common";

export const getDatabaseManager = databaseManager => ({
    createEmptyMasterDb: createEmptyMasterDb(databaseManager),
    createEmptyProductSetDb: createEmptyProductSetDb(databaseManager),
    createEmptyProductInstanceDb: createEmptyProductInstanceDb(databaseManager),
    getDatastoreConfig: databaseManager.getDatastoreConfig
});


const createEmptyMasterDb = databaseManager => async () =>  
    await databaseManager.createEmptyDb();


const createEmptyProductSetDb = databaseManager => async (productSetId) => {
    
    if(isNothing(productSetId))
        throw new Error("CreateDb: Product Set Id not supplied");
    
    return await databaseManager.createEmptyDb(productSetId);
}


const createEmptyProductInstanceDb = databaseManager => async (productSetId, productId, productInstanceId) => {
    
    if(isNothing(productSetId))
        throw new Error("CreateDb: Product Set Id not supplied");
    if(isNothing(productId))
        throw new Error("CreateDb: Product Id not supplied");
    if(isNothing(productInstanceId))
        throw new Error("CreateDb: Product Instance Id not supplied");

    return await databaseManager.createEmptyDb(productSetId, productId, productInstanceId);
}
