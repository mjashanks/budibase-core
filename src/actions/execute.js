

export const executeAction = (behaviourSources, action, options) => 
    behaviourSources[action.behaviourSource][action.behaviourName](options);
