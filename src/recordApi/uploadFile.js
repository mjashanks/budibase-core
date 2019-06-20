import {
  includes, filter,
  map, some,
} from 'lodash/fp';
import { join } from 'path';
import { generate } from 'shortid';
import { _load } from './load';
import {
  apiWrapper, events, splitKey,
  $, joinKey, isNothing, tryAwaitOrIgnore,
} from '../common';
import { getExactNodeForPath } from '../templateApi/heirarchy';
import { permission } from '../authApi/permissions';
import { isLegalFilename } from '../types/file';

export const uploadFile = app => async (recordKey, readableStream, relativePath) => apiWrapper(
  app,
  events.recordApi.uploadFile,
  permission.updateRecord.isAuthorized(recordKey),
  { recordKey, readableStream, relativePath },
  _uploadFile, app, recordKey, readableStream, relativePath,
);

const _uploadFile = async (app, recordKey, readableStream, relativePath) => {
  if (isNothing(recordKey)) { throw new Error('Record Key not supplied'); }
  if (isNothing(relativePath)) { throw new Error('file path not supplied'); }
  if (!isLegalFilename(relativePath)) { throw new Error('Illegal filename'); }

  const record = await _load(app, recordKey);

  const fullFilePath = safeGetFullFilePath(
    recordKey, relativePath,
  );

  const tempFilePath = `${fullFilePath}_${generate()}.temp`;

  const fileStream = await app.datastore.writableFileStream(
    tempFilePath,
  );

  readableStream.pipe(fileStream);

  await new Promise(fulfill => fileStream.on('finish', fulfill));

  const isExpectedFileSize = checkFileSizeAgainstFields(
    app,
    record, relativePath,
    await app.datastore.getFileSize(tempFilePath),
  );

  if (!isExpectedFileSize) { throw new Error(
    `Fields for ${relativeFilePath} do not have expected size: ${join(',')(incorrectFields)}`); }

  await tryAwaitOrIgnore(app.datastore.deleteFile, fullFilePath);

  await app.datastore.renameFile(tempFilePath, fullFilePath);
};

const checkFileSizeAgainstFields = (app, record, relativeFilePath, expectedSize) => {
  const recordNode = getExactNodeForPath(app.heirarchy)(record.key);

  const incorrectFileFields = $(recordNode.fields, [
    filter(f => f.type === 'file'
                    && record[f.name].relativePath === relativeFilePath
                    && record[f.name].size !== expectedSize),
    map(f => f.name),
  ]);

  const incorrectFileArrayFields = $(recordNode.fields, [
    filter(a => a.type === 'array<file>'
                    && $(record[a.name], [
                      some(f => record[f.name].relativePath === relativeFilePath
                                  && record[f.name].size !== expectedSize),
                    ])),
    map(f => f.name),
  ]);

  const incorrectFields = [
    ...incorrectFileFields,
    ...incorrectFileArrayFields,
  ];

  if (incorrectFields.length > 0) {
    return false;
  }

  return true;
};

export const safeGetFullFilePath = (recordKey, relativePath) => {
  const naughtyUser = () => { throw new Error('naughty naughty'); };

  if (relativePath.startsWith('..')) naughtyUser();

  const pathParts = splitKey(relativePath);

  if (includes('..')(pathParts)) naughtyUser();

  const recordKeyParts = splitKey(recordKey);

  const fullPathParts = [
    ...recordKeyParts,
    'files',
    ...filter(p => p !== '.')(pathParts),
  ];

  return joinKey(fullPathParts);
};
