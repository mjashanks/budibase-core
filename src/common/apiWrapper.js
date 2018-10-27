import {cloneDeep} from "lodash/fp";

export const apiWrapper = (app, eventNamespace, eventContext, func, ...params) => {

    const publishError = err => {
        const ctx = cloneDeep(eventContext);
        ctx.error = err;
        app.publish(
            eventNamespace.onError,
            ctx);
        throw new Error(err);
    };

    const publishComplete = result => {
        const endcontext = cloneDeep(eventContext);
        endcontext.result = result;
        app.publish(
            eventNamespace.onComplete,
            endcontext);
        return result;
    }

    try {
        app.publish(
            eventNamespace.onBegin,
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