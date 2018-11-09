import {validateActions, validateTrigger} from "../src/templateApi/validate";
import {createAction, createTrigger} from "../src/templateApi/createActions";
import {some} from "lodash";
import {getNewField, addField} from "../src/templateApi/fields";
import {getNewRecordValidationRule, commonRecordValidationRules,
    addRecordValidationRule} from "../src/templateApi/recordValidationRules";
  
describe("templateApi actions validation", () => {
    
    it("should return no errors when all actions are valid", () => {

        const {allActions} = createValidActionsAndTriggers();
        const result = validateActions(allActions);
        expect(result).toEqual([]);

    });

    

});

const createValidActionsAndTriggers = () => {
    const logAction = createAction();
    logAction.name = "log message";
    logAction.behaviourName = "log";
    logAction.behaviourSource = "budibase-behaviours";
    
    const timerAction = createAction();
    timerAction.name = "measure call time";
    timerAction.behaviourName = "call_timer";
    timerAction.behaviourSource = "buidbase-behaviours";


    const sendEmailAction = createAction();
    sendEmailAction.name = "send email";
    sendEmailAction.behaviourName = "send_email";
    sendEmailAction.behaviourSource = "my-custom-lib";

    const logOnErrorTrigger = createTrigger();
    logOnErrorTrigger.actionName = "log message";
    logOnErrorTrigger.eventName = "recordApi:save:onError";
    logOnErrorTrigger.paramsCreator = "return {error: context.error};";

    const timeRecordSaveTrigger = createTrigger();
    timeRecordSaveTrigger.actionName = "measure save";
    timeRecordSaveTrigger.eventName = "recordApi:save:onComplete";
    timeRecordSaveTrigger.paramsCreator = "return {context.elapsed:elapsed}";

    const allActions = [logAction, timerAction, sendEmailAction];
    const allTriggers = [logOnErrorTrigger, timeRecordSaveTrigger];

    return {
        logAction, timerAction, sendEmailAction,
        logOnErrorTrigger, timeRecordSaveTrigger,
        allActions, allTriggers
    };
};