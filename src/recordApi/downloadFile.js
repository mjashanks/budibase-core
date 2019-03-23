import {apiWrapper, events, isNothing} from "../common";
import {permission} from "../authApi/permissions";
import {safeGetFullFilePath} from "./uploadFile";

export const downloadFile = (app) => async (recordKey, relativePath) => 
    apiWrapper(
        app,
        events.recordApi.uploadFile, 
        permission.readRecord.isAuthorized(recordKey),
        {recordKey, recordKey, relativePath},
        _downloadFile, app, recordKey, relativePath);


const _downloadFile = async (app, recordKey, relativePath) => {
    
    if(isNothing(recordKey))
        throw new Error("Record Key not supplied");
    if(isNothing(relativePath))
        throw new Error("file path not supplied");

    return await app.datastore.readableFileStream(
        safeGetFullFilePath(
            recordKey, relativePath)
    );
};

