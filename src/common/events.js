export const event = area => method => name =>
    `${area}:${method}:${name}`;

export const onBegin = "onBegin";
export const onComplete = "onEnd";
export const onError = "onError";
