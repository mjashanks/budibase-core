import { join } from 'lodash';
import { permission } from '../authApi/permissions';
import { appDefinitionFile } from '../common';
import { validateAll } from './validate';
import { apiWrapper } from '../common/apiWrapper';
import { events } from '../common/events';

export const saveApplicationHeirarchy = app => async heirarchy => apiWrapper(
  app,
  events.templateApi.saveApplicationHeirarchy,
  permission.writeTemplates.isAuthorized,
  { heirarchy },
  _saveApplicationHeirarchy, app.datastore, heirarchy,
);


export const _saveApplicationHeirarchy = async (datastore, heirarchy) => {
  const validationErrors = await validateAll(heirarchy);
  if (validationErrors.length > 0) {
    throw new Error(`Heirarchy is invalid: ${join(
      validationErrors.map(e => `${e.item.nodeKey ? e.item.nodeKey() : ''} : ${e.error}`),
      ',',
    )}`);
  }

  if (await datastore.exists(appDefinitionFile)) {
    const appDefinition = await datastore.loadJson(appDefinitionFile);
    appDefinition.heirarchy = heirarchy;
    await datastore.updateJson(appDefinitionFile, appDefinition);
  } else {
    await datastore.createFolder('/.config');
    const appDefinition = { actions: [], triggers: [], heirarchy };
    await datastore.createJson(appDefinitionFile, appDefinition);
  }
};
