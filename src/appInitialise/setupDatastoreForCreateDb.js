import {isNothing} from "../common";

export const getDatabaseCreator = datastore => ({
    createEmptyMasterDb: createEmptyMasterDb(datastore),
    createEmptyProductSetDb: createEmptyProductSetDb(datastore),
    createEmptyProductInstanceDb: createEmptyProductInstanceDb(datastore)
});


const createEmptyMasterDb = ds => async () =>  
    await ds.createEmptyDb();


const createEmptyProductSetDb = ds => async (productSetId) => {
    
    if(isNothing(productSetId))
        throw new Error("CreateDb: Product Set Id not supplied");
    
    return await ds.createEmptyDb(productSetId);
}


const createEmptyProductInstanceDb = ds => async (productSetId, productId, productInstanceId) => {
    
    if(isNothing(productSetId))
        throw new Error("CreateDb: Product Set Id not supplied");
    if(isNothing(productId))
        throw new Error("CreateDb: Product Id not supplied");
    if(isNothing(productInstanceId))
        throw new Error("CreateDb: Product Instance Id not supplied");

    return await ds.createEmptyDb(productSetId, productId, productInstanceId);
}
