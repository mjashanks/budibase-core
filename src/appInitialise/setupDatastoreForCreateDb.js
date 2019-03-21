import {isNothing} from "../common";

export const getDatabaseFactory = createEmptyDb => ({
    createEmptyMasterDb: createEmptyMasterDb(createEmptyDb),
    createEmptyProductSetDb: createEmptyProductSetDb(createEmptyDb),
    createEmptyProductInstanceDb: createEmptyProductInstanceDb(createEmptyDb)
});


const createEmptyMasterDb = rootStore => async () =>  
    await rootStore.createEmptyDb();


const createEmptyProductSetDb = createEmptyDb => async (productSetId) => {
    
    if(isNothing(productSetId))
        throw new Error("CreateDb: Product Set Id not supplied");
    
    return await createEmptyDb(productSetId);
}


const createEmptyProductInstanceDb = createEmptyDb => async (productSetId, productId, productInstanceId) => {
    
    if(isNothing(productSetId))
        throw new Error("CreateDb: Product Set Id not supplied");
    if(isNothing(productId))
        throw new Error("CreateDb: Product Id not supplied");
    if(isNothing(productInstanceId))
        throw new Error("CreateDb: Product Instance Id not supplied");

    return await createEmptyDb(productSetId, productId, productInstanceId);
}
