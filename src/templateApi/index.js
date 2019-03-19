import {appDefinitionFile} from "../common";
import {join} from "lodash";
import {map} from "lodash/fp";
import {getNewCollectionTemplate, getNewRootLevel, 
        getNewRecordTemplate, getNewIndexTemplate,
        createNodeErrors, constructHeirarchy,
        getNewAggregateGroupTemplate,
        getNewAggregateTemplate} 
        from "./createNodes";
import {getNewField, validateField, 
        addField, fieldErrors} from "./fields";
import {getNewRecordValidationRule, commonRecordValidationRules,
        addRecordValidationRule} from "./recordValidationRules";
import {createAction, createTrigger} from "./createActions";
import {validateTriggers, validateTrigger, 
        validateActions, validateAll} from "./validate";
import {getApplicationDefinition} from "./getApplicationDefinition"
import {saveApplicationHeirarchy} from "./saveApplicationHeirarchy";
import {saveActionsAndTriggers} from "./saveActionsAndTriggers";

const api = app => ({
    
    getApplicationDefinition : getApplicationDefinition(app.datastore),
    saveApplicationHeirarchy : saveApplicationHeirarchy(app),
    saveActionsAndTriggers : saveActionsAndTriggers(app),

    getNewRootLevel, getNewCollectionTemplate, 
    getNewIndexTemplate, getNewRecordTemplate,
    getNewField, validateField, addField, fieldErrors,
    getNewRecordValidationRule, commonRecordValidationRules, 
    addRecordValidationRule, createAction, createTrigger, validateActions,
    validateTrigger, getNewAggregateGroupTemplate,
    getNewAggregateTemplate
});


export const getTemplateApi = app => api(app);

export const errors = createNodeErrors;

export default getTemplateApi;
