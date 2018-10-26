import {onComplete, onBegin,
    onError, event} from "./events";
import {cloneDeep} from "lodash/fp";

export const apiWrapper = (app, area, method, eventContext, func, ...params) => {

    const publishError = err => {
        const ctx = cloneDeep(eventContext);
        ctx.error = err;
        app.publish(
            event(area)(method)(onError),
            ctx);
        throw new Error(err);
    };

    const publishComplete = result => {
        const endcontext = cloneDeep(eventContext);
        endcontext.result = result;
        app.publish(
            event(area)(method)(onComplete),
            endcontext);
        return result;
    }

    try {
        app.publish(
            event(area)(method)(onBegin),
            eventContext
        );

        const result = func(...params);
        if(result.catch) {
            result.catch(publishError)
        }

        if(result.then) {
            return result.then(publishComplete);
        }
        
        publishComplete(result);
        return result;

    } catch (error) {
        publishError(error)
    }
}

export default apiWrapper;