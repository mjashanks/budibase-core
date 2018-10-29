import {cloneDeep, isUndefined} from "lodash/fp";
import {generate} from "shortid";

export const apiWrapper = (app, eventNamespace, eventContext, func, ...params) => {

    const startDate = Date.now();
    const elapsed = () => 
        (Date.now() - startDate);

    const publishError = err => {
        const ctx = cloneDeep(eventContext);
        ctx.error = err;
        ctx.elapsed = elapsed();
        app.publish(
            eventNamespace.onError,
            ctx);
        popCallStack(app);
        throw new Error(err);
    };

    const publishComplete = result => {
        const endcontext = cloneDeep(eventContext);
        endcontext.result = result;
        endcontext.elapsed = elapsed();
        app.publish(
            eventNamespace.onComplete,
            endcontext);
        popCallStack(app);
        return result;
    }

    pushCallStack(app,eventNamespace);

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

const pushCallStack = (app, eventNamespace, seedCallId) => {

    const callId = generate();

    const createCallStack = () => ({
        seedCallId: !isUndefined(seedCallId) 
                    ? seedCallId
                    : callId,
        threadCallId:callId,
        stack: []
    });

    if(isUndefined(app.calls)) {
        app.calls = createCallStack();
    }

    app.calls.stack.push({
        namespace:eventNamespace,
        callId
    });
}

const popCallStack = (app) => app.calls.stack.pop();


export default apiWrapper;