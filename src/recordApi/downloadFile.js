import { apiWrapper, events, isNothing } from '../common';
import { permission } from '../authApi/permissions';
import { safeGetFullFilePath } from './uploadFile';
import { badRequestError } from '../common/errors';

export const downloadFile = app => async (recordKey, relativePath) => apiWrapper(
  app,
  events.recordApi.uploadFile,
  permission.readRecord.isAuthorized(recordKey),
  { recordKey, relativePath },//remove dupe key 'recordKey' from object
  _downloadFile, app, recordKey, relativePath,
); 


const _downloadFile = async (app, recordKey, relativePath) => {
  if (isNothing(recordKey)) { throw badRequestError('Record Key not supplied'); }
  if (isNothing(relativePath)) { throw badRequestError('file path not supplied'); }

  return await app.datastore.readableFileStream(
    safeGetFullFilePath(
      recordKey, relativePath,
    ),
  );
};
