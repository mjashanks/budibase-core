import {apiWrapper, events} from "../common";
import {permission} from "../authApi/permissions";
import {safeGetFullFilePath} from "./uploadFile";

export const downloadFile = (app) => async (recordKey, relativePath) => 
    apiWrapper(
        app,
        events.recordApi.uploadFile, 
        permission.readRecord.isAuthorized(record.key),
        {recordKey, recordKey, relativePath},
        _downloadFile, app, recordKey, readableStream);


const _downloadFile = async (app, recordKey, relativePath) => 
    await app.datastore.readableStream(
        safeGetFullFilePath(
            recordKey, relativePath)
    );

