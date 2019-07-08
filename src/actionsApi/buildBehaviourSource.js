import { has } from 'lodash';
import { conflictError } from '../common/errors';

export const createBehaviourSources = () => {
  const sources = {};
  const register = (name, funcsObj) => {
    if (has(sources, name)) {
      throw conflictError(`Source '${name}' already exists`);
    }

    sources[name] = funcsObj;
  };
  sources.register = register;
  return sources;
};
