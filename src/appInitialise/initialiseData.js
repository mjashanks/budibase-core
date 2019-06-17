import { filter } from 'lodash/fp';
import { configFolder, appDefinitionFile, $ } from '../common';
import { TRANSACTIONS_FOLDER } from '../transactions/transactionsCommon';
import { AUTH_FOLDER, USERS_LIST_FILE, ACCESS_LEVELS_FILE } from '../authApi/authCommon';
import { initialiseRootCollections } from '../collectionApi/initialise';
import { initialiseIndex } from '../indexing/initialiseIndex';
import { getFlattenedHierarchy, isGlobalIndex, isSingleRecord } from '../templateApi/heirarchy';
import { _save } from '../recordApi/save';
import { getNew } from '../recordApi/getNew';

export const initialiseData = async (datastore, applicationDefinition) => {
  await datastore.createFolder(configFolder);
  await datastore.createJson(appDefinitionFile, applicationDefinition);

  await initialiseRootCollections(datastore, applicationDefinition.heirarchy);
  await initialiseRootIndexes(datastore, applicationDefinition.heirarchy);

  await initialiseRootSingleRecords(datastore, applicationDefinition.heirarchy);

  await datastore.createFolder(TRANSACTIONS_FOLDER);

  await datastore.createFolder(AUTH_FOLDER);

  await datastore.createJson(USERS_LIST_FILE, []);

  await datastore.createJson(ACCESS_LEVELS_FILE, { version: 0, levels: [] });
};

const initialiseRootIndexes = async (datastore, heirarchy) => {
  const flatheirarchy = getFlattenedHierarchy(heirarchy);
  const globalIndexes = $(flatheirarchy, [
    filter(isGlobalIndex),
  ]);

  for (const index of globalIndexes) {
    if (!await datastore.exists(index.nodeKey())) { await initialiseIndex(datastore, '', index); }
  }
};

const initialiseRootSingleRecords = async (datastore, hierachy) => {
  const flatheirarchy = getFlattenedHierarchy(hierachy);
  const singleRecords = $(flatheirarchy, [
    filter(isSingleRecord),
  ]);

  /* for (let record of singleRecords) {
        const result = getNew({ datastore: datastore, hierarchy: appDefinition.hierarchy })
            (record.nodeKey(),
                record.name
            );

        _save({ datastore: datastore, hierarchy: appDefinition.hierarchy },
            result
        );
    } */
};
