import {has} from "lodash";

const publish = agg => (eventName, context) => {
    if(!has(agg, eventName)) return;

    for(let handler of agg[eventName]) {
        handler(eventName, context);
    }
};

const subscribe = agg => (eventName, handler) => {
    if(!has(agg, eventName)) {
        agg[eventName] = [];
    }
    agg[eventName].push(handler);
};

export const createEventAggregator = () => {
    const agg = {};
    return ({publish: publish(agg), subscribe: subscribe(agg)});
};

export default createEventAggregator;