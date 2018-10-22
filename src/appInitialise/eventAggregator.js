import {has} from "lodash";

const publish = agg => async (actionName, context) => {
    if(!has(agg[actionName])) return;

    for(let handler in agg[actionName]) {
        await handler(context);
    }
};

const subscribe = agg => (actionName, handler) => {
    if(!has(agg, actionName)) {
        agg[actionName] = [];
    }
    agg[actionName].push(handler);
};
    

export const createEventAggregator = () => {
    const agg = {};
    return ({publish: publish(agg), subscribe: subscribe(agg)});
};

export default createEventAggregator;