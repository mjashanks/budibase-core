import {applicationHeirarchy} from "../common";
import {each} from "lodash";
import {getNewCollectionTemplate, getNewRootLevel, 
        getNewRecordTemplate, getNewViewTemplate,
        createNodeErrors, constructHeirarchy} from "./createNodes";
import {getNewField, validateField, addField, fieldErrors} from "./fields";
import {getNewRecordValidationRule, commonRecordValidationRules,
        addRecordValidationRule} from "./recordValidationRules";

const api = datastore => ({
    
    ensureDefaults : (note, defaultFields) => {
        if(!defaultFields) return;
        each(Object.keys(defaultFields), key => {
            if(typeof note[key] === "undefined") {
                note[key] = defaultFields[key].defaultValue();
            }
        });
    },

    getApplicationHeirarchy : async () => 
        (await datastore.exists(applicationHeirarchy))
        ? constructHeirarchy(
                await datastore.loadJson(applicationHeirarchy)
           )
        : {},

    saveApplicationHeirarchy : async (appHeirarchy) =>{
        if(await datastore.exists(applicationHeirarchy))
            await datastore.updateJson(applicationHeirarchy, appHeirarchy);
        else
            await datastore.createJson(applicationHeirarchy, appHeirarchy);
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
