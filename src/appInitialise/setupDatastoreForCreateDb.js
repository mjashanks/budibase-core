
export const getDatabaseCreator = datastore => ({
    createEmptyMasterDb: createEmptyMasterDb(datastore),
    createEmptyProductSetDb: createEmptyProductSetDb(datastore),
    createEmptyProductInstanceDb: createEmptyProductInstanceDb(datastore)
});


const createEmptyMasterDb = ds => async () =>  
    await ds.createEmptyDb();


const createEmptyProductSetDb = ds => async (productSetId) => 
    await ds.createEmptyDb(productSetId);


const createEmptyProductInstanceDb = ds => async (productSetId, productId, productInstanceId) => 
    await ds.createEmptyDb(productSetId, productId, productInstanceId)
