import {isNothing} from "../common";

export const getDatabaseManager = databaseManager => ({
    createEmptyMasterDb: createEmptyMasterDb(databaseManager),
    createEmptyProductSetDb: createEmptyProductSetDb(databaseManager),
    createEmptyProductInstanceDb: createEmptyProductInstanceDb(databaseManager),
    getProductSetDbRootConfig: databaseManager.getProductSetDbRootConfig,
    getProductInstanceDbRootConfig: databaseManager.getProductInstanceDbRootConfig,
    masterDatastoreConfig: getMasterDatastoreConfig(databaseManager),
    getProductSetDatastoreConfig: getProductSetDatastoreConfig(databaseManager),
    getProductInstanceDatastoreConfig: getProductInstanceDatastoreConfig(databaseManager)
});

const getMasterDatastoreConfig = databaseManager => 
    databaseManager.getDatastoreConfig(
        databaseManager.getMasterDbRootConfig,
        "master"
    );

const getProductSetDatastoreConfig = databaseManager => 
                                    (dbRootConfig, productSetId) => 
    databaseManager.getDatastoreConfig(
        dbRootConfig, "productset", productSetId
    );

const getProductInstanceDatastoreConfig = databaseManager => 
                            (dbRootConfig, productSetId, productId, productInstanceId) => 
    databaseManager.getDatastoreConfig(
        dbRootConfig, "productinstance",
        productSetId, productId, productInstanceId
    );

const createEmptyMasterDb = databaseManager => async () =>  
    await databaseManager.createEmptyDb(
        databaseManager.getMasterDbRootConfig(),
        "master"
    );


const createEmptyProductSetDb = databaseManager => async (productSetId) => {
    
    if(isNothing(productSetId))
        throw new Error("CreateDb: Product Set Id not supplied");
    
    return await databaseManager.createEmptyDb(
        databaseManager.getProductSetDbRootConfig(productSetId), 
        "productset", productSetId);
}


const createEmptyProductInstanceDb = databaseManager => async (productSetId, productId, productInstanceId) => {
    
    if(isNothing(productSetId))
        throw new Error("CreateDb: Product Set Id not supplied");
    if(isNothing(productId))
        throw new Error("CreateDb: Product Id not supplied");
    if(isNothing(productInstanceId))
        throw new Error("CreateDb: Product Instance Id not supplied");

    return await databaseManager.createEmptyDb(
        databaseManager.getProductInstanceDbRootConfig(productSetId, productId, productInstanceId), 
        "productinstance", 
        productSetId, productId, productInstanceId);
}
