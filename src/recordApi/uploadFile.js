import {includes} from "lodash/fp";
import {_load} from "./load";
import {apiWrapper, events, $, joinKey} from "../common";
import { getExactNodeForPath} from "../templateApi/heirarchy";
import {permission} from "../authApi/permissions";
import {splitKey, joinKey} from "../common";
import { join } from "path";

export const uploadFile = (app) => async (recordKey, readableStream, relativePath) => 
    apiWrapper(
        app,
        events.recordApi.uploadFile, 
        permission.updateRecord.isAuthorized(record.key),
        {recordKey, readableStream, relativePath},
        _uploadFile, app, recordKey, readableStream);


const _uploadFile = async (app, recordKey, readableStream, relativePath="") => {
    
    const record = await _load(app, recordKey);
    checkFileSizeAgainstFields(
        record, relativePath, 
        readableStream.readableLength)

    const fullFilePath = safeGetFullFilePath(
        recordKey, relativePath);

    const fileStream = await app.datastore.writableFileStream(
        fullFilePath);

    readableStream.pipe(fileStream);    

}

const checkFileSizeAgainstFields = (record, relativeFilePath, expectedSize) => {
    const recordNode = getExactNodeForPath(app.heirarchy)(record.key);

    const incorrectFileFields = $(recordNode.fields, [
        filter(f => f.type === "file"
                    && record[f.name].relativePath === relativeFilePath
                    && record[f.name].size !== expectedSize),
        map(f => f.name)
    ]);

    const incorrectFileArrayFields = $(recordNode.fields, [
        filter(a => a.type === "array<file>" &&
                    $(record[a.name], [
                        some(f => record[f.name].relativePath === relativeFilePath
                                  && record[f.name].size !== expectedSize)
                    ])
        ),
        map(f => f.name)
    ]);

    const incorrectFields = [
        ...incorrectFileFields,
        ...incorrectFileArrayFields
    ];

    if(incorrectFields.length > 0) {
        throw new Error("Fields for " + relativeFilePath + " do not have expected size: " + join(",")(incorrectFields));
    }

    return true;
}

export const safeGetFullFilePath = (recordKey, relativePath) => {
   
    const naughtyUser = () => { throw new Error("naughty naughty"); };

    if(relativePath.startsWith("..")) naughtyUser();

    const pathParts = splitKey(relativePath);

    if(includes("..")(pathParts)) naughtyUser();

    const recordKeyParts = splitKey(recordKey);
    return joinKey(
        [
            ...[recordKeyParts],
            "files", 
            ...[filter(p => p !== ".")(pathParts)]
        ]
    );

}