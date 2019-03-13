import {configFolder, appDefinitionFile} from "../common";
import {TRANSACTIONS_FOLDER} from "../transactions/transactionsCommon";
import {AUTH_FOLDER, USERS_LIST_FILE, ACCESS_LEVELS_FILE} from "../authApi/authCommon";
import {initialiseRootCollections} from "../collectionApi/initialise";

export const initialiseData = async (datastore, applicationDefinition) => {
    await datastore.createFolder(configFolder);
    await datastore.createJson(appDefinitionFile, applicationDefinition);

    await initialiseRootCollections(datastore, applicationDefinition.heirarchy);

    await datastore.createFolder(TRANSACTIONS_FOLDER);

    await datastore.createFolder(AUTH_FOLDER);

    await datastore.createJson(USERS_LIST_FILE, []);

    await datastore.createJson(ACCESS_LEVELS_FILE, {version:0,levels:[]});
}