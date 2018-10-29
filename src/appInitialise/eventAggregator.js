import {has} from "lodash/fp";

const publish = handlers => (eventName, context = {}) => {
    if(!has(handlers, eventName)) return;

    for(let handler of handlers[eventName]) {
        handler(eventName, context);
    }
};

const subscribe = handlers => (eventName, handler) => {
    if(!has(handlers, eventName)) {
        handlers[eventName] = [];
    }
    handlers[eventName].push(handler);
};

export const createEventAggregator = () => {
    const handlers = {};
    const eventAggregator = ({
        publish: publish(handlers),
        subscribe: subscribe(handlers)
    });
    return eventAggregator;
};

export default createEventAggregator;