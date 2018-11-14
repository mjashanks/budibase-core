import {isFunction, filter, map, 
        uniqBy, keys, difference,
        join, reduce} from "lodash/fp";
import {$} from "../common";
import {executeAction} from "./execute";
import {compileExpression, compileCode} from "@nx-js/compiler-util";

export const initialiseActions = (subscribe, behaviourSources, actions, triggers) => {
    
    validateSources(behaviourSources, actions);
    subscribeTriggers(subscribe, behaviourSources, actions, triggers);
    return createActionsCollection(behaviourSources, actions);

};

const createActionsCollection = (behaviourSources, actions) =>
    $(actions,[
        reduce((all,a) => {
            all[a.name] = opts => executeAction(behaviourSources, a, opts)
            return all;
        }, {})
    ]);

const subscribeTriggers = (subscribe, behaviourSources, actions, triggers) => {

    const createOptions = (trigger, eventContext) => {
        if(!trigger.optionsCreator) return {};
        const create = compileCode(trigger.optionsCreator);
        return create(eventContext);
    };

    const shouldRunTrigger = (trigger, eventContext) => {
        if(!trigger.condition) return true;
        const shouldRun = compileExpression(trigger.condition);
        return shouldRun(eventContext);
    };

    for(let trig of triggers) {
        subscribe(trig.eventName, (ev, ctx) => {
            if(shouldRunTrigger(trig, ctx)) {
                executeAction(
                    behaviourSources, 
                    actions[trig.actionName], 
                    createOptions(trig.optionsCreator));
            }
        });
    }

};

const validateSources = (behaviourSources, actions) => {

    const declaredSources = $(actions, [
        uniqBy(a => a.behaviourSource),
        map(a => a.behaviourSource)
    ]);

    const suppliedSources = keys(behaviourSources);

    const missingSources = difference(
        declaredSources, suppliedSources
    );

    if(missingSources.length > 0) {
        throw new Error("Declared behaviour sources are not supplied: " + join(", ", missingSources));
    }

    const missingBehaviours = $(actions, [
        filter(a => !isFunction(behaviourSources[a.behaviourSource][a.behaviourName])),
        map(a => `Action: ${a.name} : ${a.behaviourSource}.${a.behaviourName}`)
    ]);

    if(missingBehaviours.length > 0) {
        throw new Error("Missing behaviours: could not behaviour functions: " + join(", ", missingBehaviours));
    }
};