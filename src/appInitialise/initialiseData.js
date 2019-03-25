import {configFolder, appDefinitionFile, $} from "../common";
import {TRANSACTIONS_FOLDER} from "../transactions/transactionsCommon";
import {AUTH_FOLDER, USERS_LIST_FILE, ACCESS_LEVELS_FILE} from "../authApi/authCommon";
import {initialiseRootCollections} from "../collectionApi/initialise";
import {initialiseIndex} from "../indexing/initialiseIndex";
import {getFlattenedHierarchy, isGlobalIndex} from "../templateApi/heirarchy";
import {filter} from "lodash/fp";

export const initialiseData = async (datastore, applicationDefinition) => {
    await datastore.createFolder(configFolder);
    await datastore.createJson(appDefinitionFile, applicationDefinition);

    await initialiseRootCollections(datastore, applicationDefinition.heirarchy);
    await initialiseRootIndexes(datastore, applicationDefinition.heirarchy);
    await datastore.createFolder(TRANSACTIONS_FOLDER);

    await datastore.createFolder(AUTH_FOLDER);

    await datastore.createJson(USERS_LIST_FILE, []);

    await datastore.createJson(ACCESS_LEVELS_FILE, {version:0,levels:[]});
}

const initialiseRootIndexes = async (datastore, heirarchy) => {

    const flatheirarchy = getFlattenedHierarchy(heirarchy);
    const globalIndexes = $(flatheirarchy, [
        filter(isGlobalIndex)
    ]);

    for(let index of globalIndexes) {
        if(!await datastore.exists(index.nodeKey()))
            await initialiseIndex(datastore, "", index);
    } 
}