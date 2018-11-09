import {isUndefined} from "lodash/fp";
import {isNothing} from "../common";

export const createTrigger = () => ({
    actionName: "",
    eventName: "",
    // function, has access to event context, 
    // returns object that is used as parameter to action
    // only used if triggered by event
    paramsCreator: "",
    // action runs if true, 
    // has access to event context 
    condition: "" 
})

export const createAction = () => ({
    name: "", 
    behaviourSource: "", 
    // name of function in actionSource
    behaviourName: "",    
});


