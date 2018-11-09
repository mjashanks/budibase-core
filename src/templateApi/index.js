import {appDefinitionFile} from "../common";
import {each} from "lodash";
import {getNewCollectionTemplate, getNewRootLevel, 
        getNewRecordTemplate, getNewViewTemplate,
        createNodeErrors, constructHeirarchy} from "./createNodes";
import {getNewField, validateField, addField, fieldErrors} from "./fields";
import {getNewRecordValidationRule, commonRecordValidationRules,
        addRecordValidationRule} from "./recordValidationRules";

const api = datastore => ({
    
    getApplicationDefinition : async () => {
        const exists = await datastore.exists(appDefinitionFile);

        if(!exists) throw new Error("Application definition does not exist");

        const appDefinition = await datastore.loadJson(appDefinitionFile);
        appDefinition.heirarchy = constructHeirarchy(
            appDefinition.heirarchy            
        );
        return appDefinition;
    },

    saveApplicationHeirarchy : async (heirarchy) =>{
        if(await datastore.exists(appDefinitionFile)){
            const appDefinition = await datastore.loadJson(appDefinitionFile);
            appDefinition.heirarchy = heirarchy;
            await datastore.updateJson(appDefinitionFile, appDefinition);
        }
        else {
            await datastore.createFolder("/.config");
            const appDefinition = {actions:[], heirarchy};
            await datastore.createJson(appDefinitionFile, appDefinition);
        }
    },

    getNewRootLevel, getNewCollectionTemplate, getNewViewTemplate,
    getNewViewTemplate, getNewRecordTemplate,
    getNewField, validateField, addField, fieldErrors,
    getNewRecordValidationRule, commonRecordValidationRules, 
    addRecordValidationRule,
    _storeHandle : datastore
});


export const getTemplateApi = datastore => api(datastore);

export const errors = createNodeErrors;

export default getTemplateApi;
