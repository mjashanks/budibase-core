import { has } from 'lodash';

export const createBehaviourSources = () => {
  const sources = {};
  const register = (name, funcsObj) => {
    if (has(sources, name)) {
      throw new Error(`Source '${name}' already exists`);
    }

    sources[name] = funcsObj;
  };
  sources.register = register;
  return sources;
};
