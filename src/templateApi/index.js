import {appDefinitionFile} from "../common";
import {join} from "lodash";
import {map} from "lodash/fp";
import {getNewCollectionTemplate, getNewRootLevel, 
        getNewRecordTemplate, getNewViewTemplate,
        createNodeErrors, constructHeirarchy} from "./createNodes";
import {getNewField, validateField, addField, fieldErrors} from "./fields";
import {getNewRecordValidationRule, commonRecordValidationRules,
        addRecordValidationRule} from "./recordValidationRules";
import {createAction, createTrigger} from "./createActions";
import {validateTriggers, validateTrigger, validateActions} from "./validate";

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
            const appDefinition = {actions:[], triggers:[], heirarchy};
            await datastore.createJson(appDefinitionFile, appDefinition);
        }
    },

    saveActionsAndTriggers : async (actions, triggers) => {
        if(await datastore.exists(appDefinitionFile)){
            const appDefinition = await datastore.loadJson(appDefinitionFile);
            appDefinition.actions = actions;
            appDefinition.triggers = triggers;

            const actionValidErrs = map(e => e.error)
                                    (validateActions(actions));
            
            if(actionValidErrs.length > 0) {
                throw new Error("Actions are in valid: " + join(actionValidErrs,", "));
            }

            const triggerValidErrs = map(e => e.error)
                                    (validateTriggers(triggers, actions));
            
            if(triggerValidErrs.length > 0) {
                throw new Error("Triggers are in valid: " + join(triggerValidErrs,", "));
            }

            await datastore.updateJson(appDefinitionFile, appDefinition);
        }
        else {
            throw new Error("Cannot save actions: Application definition does not exist");
        }
    },

    getNewRootLevel, getNewCollectionTemplate, getNewViewTemplate,
    getNewViewTemplate, getNewRecordTemplate,
    getNewField, validateField, addField, fieldErrors,
    getNewRecordValidationRule, commonRecordValidationRules, 
    addRecordValidationRule, createAction, createTrigger, validateActions,
    validateTrigger,
    _storeHandle : datastore
});


export const getTemplateApi = datastore => api(datastore);

export const errors = createNodeErrors;

export default getTemplateApi;
