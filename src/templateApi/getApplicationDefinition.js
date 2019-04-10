import {appDefinitionFile} from "../common";
import {constructHeirarchy} from "./createNodes";

export const getApplicationDefinition = (datastore) => async () => {
    const exists = await datastore.exists(appDefinitionFile);

    if(!exists) throw new Error("Application definition does not exist");

    const appDefinition = await datastore.loadJson(appDefinitionFile);
    appDefinition.heirarchy = constructHeirarchy(
        appDefinition.heirarchy            
    );
    return appDefinition;
}