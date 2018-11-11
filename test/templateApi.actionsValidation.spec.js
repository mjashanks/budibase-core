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

    it("should return error for empty behaviourName", () => {

        const {allActions, logAction} = createValidActionsAndTriggers();
        logAction.behaviourName = "";
        const result = validateActions(allActions);
        expect(result.length).toBe(1);
        expect(result[0].field).toEqual("behaviourName");

    });

    it("should return error for empty behaviourSource", () => {

        const {allActions, logAction} = createValidActionsAndTriggers();
        logAction.behaviourSource = "";
        const result = validateActions(allActions);
        expect(result.length).toBe(1);
        expect(result[0].field).toEqual("behaviourSource");

    });

    it("should return error for empty name", () => {

        const {allActions, logAction} = createValidActionsAndTriggers();
        logAction.name = "";
        const result = validateActions(allActions);
        expect(result.length).toBe(1);
        expect(result[0].field).toEqual("name");

    });

    it("should return error for duplicate name", () => {

        const {allActions, logAction, timerAction} = createValidActionsAndTriggers();
        logAction.name = timerAction.name;
        const result = validateActions(allActions);
        expect(result.length).toBe(1);
        expect(result[0].field).toEqual("");

    });

});

describe("tempalteApi triggers validation", () => {

    it("should return error when actionName is empty", () => {
        const {allActions, logOnErrorTrigger} = createValidActionsAndTriggers();
        logOnErrorTrigger.actionName = "";
        const result = validateTrigger(logOnErrorTrigger, allActions);
        expect(result.length).toBe(1);
        expect(result[0].field).toEqual("actionName");
    });

    it("should return error when eventName is empty", () => {
        const {allActions, logOnErrorTrigger} = createValidActionsAndTriggers();
        logOnErrorTrigger.eventName = "";
        const result = validateTrigger(logOnErrorTrigger, allActions);
        expect(result.length).toBe(1);
        expect(result[0].field).toEqual("eventName");
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