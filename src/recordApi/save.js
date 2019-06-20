import {
  cloneDeep,
  flatten,
  map,
  filter,
} from 'lodash/fp';
import { initialiseChildCollections } from '../collectionApi/initialise';
import { validate } from './validate';
import { _load, getRecordFileName } from './load';
import {
  apiWrapper, events, $, joinKey,
} from '../common';
import {
  getFlattenedHierarchy,
  getExactNodeForPath,
  isRecord,
  getNode,
  fieldReversesReferenceToNode,
} from '../templateApi/heirarchy';
import { addToAllIds } from '../indexing/allIds';
import {
  transactionForCreateRecord,
  transactionForUpdateRecord,
} from '../transactions/create';
import { permission } from '../authApi/permissions';
import { initialiseIndex } from '../indexing/initialiseIndex';

export const save = app => async (record, context) => apiWrapper(
  app,
  events.recordApi.save,
  record.isNew
    ? permission.createRecord.isAuthorized(record.key)
    : permission.updateRecord.isAuthorized(record.key), { record },
  _save, app, record, context, false,
);


export const _save = async (app, record, context, skipValidation = false) => {
  const recordClone = cloneDeep(record);
  if (!skipValidation) {
    const validationResult = await validate(app)(recordClone, context);
    if (!validationResult.isValid) {
      app.publish(events.recordApi.save.onInvalid, { record, validationResult });
      throw new Error(`Save : Record Invalid : ${
        JSON.stringify(validationResult.errors)}`);
    }
  }

  if (recordClone.isNew) {
    await addToAllIds(app.heirarchy, app.datastore)(recordClone);
    const transaction = await transactionForCreateRecord(
      app, recordClone,
    );
    recordClone.transactionId = transaction.id;
    await app.datastore.createFolder(recordClone.key);
    await app.datastore.createFolder(
      joinKey(recordClone.key, 'files'),
    );
    await app.datastore.createJson(
      getRecordFileName(recordClone.key),
      recordClone,
    );
    await initialiseReverseReferenceIndexes(app, record);
    await initialiseAncestorIndexes(app, record);
    await initialiseChildCollections(app, recordClone.key);
    app.publish(events.recordApi.save.onRecordCreated, {
      record: recordClone,
    });
  } else {
    const oldRecord = await _load(app, recordClone.key);
    const transaction = await transactionForUpdateRecord(
      app, oldRecord, recordClone,
    );
    recordClone.transactionId = transaction.id;
    await app.datastore.updateJson(
      getRecordFileName(recordClone.key),
      recordClone,
    );

    app.publish(events.recordApi.save.onRecordUpdated, {
      old: oldRecord,
      new: recordClone,
    });
  }

  await app.cleanupTransactions();

  const returnedClone = cloneDeep(recordClone);
  returnedClone.isNew = false;
  return returnedClone;
};

const initialiseAncestorIndexes = async (app, record) => {
  const recordNode = getExactNodeForPath(app.heirarchy)(record.key);

  for (const index of recordNode.indexes) {
    const indexKey = joinKey(record.key, index.name);
    if (!await app.datastore.exists(indexKey)) { await initialiseIndex(app.datastore, record.key, index); }
  }
};

const initialiseReverseReferenceIndexes = async (app, record) => {
  const recordNode = getExactNodeForPath(app.heirarchy)(record.key);

  const indexNodes = $(fieldsThatReferenceThisRecord(app, recordNode), [
    map(f => $(f.typeOptions.reverseIndexNodeKeys, [
      map(n => getNode(
        app.heirarchy,
        n,
      )),
    ])),
    flatten,
  ]);

  for (const indexNode of indexNodes) {
    await initialiseIndex(
      app.datastore, record.key, indexNode,
    );
  }
};

const fieldsThatReferenceThisRecord = (app, recordNode) => $(app.heirarchy, [
  getFlattenedHierarchy,
  filter(isRecord),
  map(n => n.fields),
  flatten,
  filter(fieldReversesReferenceToNode(recordNode)),
]);
