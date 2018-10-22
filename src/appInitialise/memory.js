import {dirIndex, getDirFromKey, $, 
        getFileFromKey, awEx,
        getIndexKeyFromFileKey} from "../common";
import {isUndefined, filter, has} from "lodash";

export const createFile = data => async (path, content) => {
    if(await exists(data)(path)) throw new Error(path + " already exists");
    data[path] = content;
};
export const updateFile = data => async (path, content) => {
    // putting this check in to force use of create
    if(!await exists(data)(path)) throw new Error("cannot update " + path + " - does not exist"); 
    data[path] = content;
}
export const loadFile = data => async (path) => {
    const result = data[path];
    if(isUndefined(result)) throw new Error("Load failed - path " + path + " does not exist");
    return result;
};
export const exists = data => async (path) => has(data, path);
export const deleteFile = data => async (path) => delete data[path];


export default data => {
    return {
        createFile : createFile(data),
        updateFile : updateFile(data),
        loadFile : loadFile(data),
        exists : exists(data),
        deleteFile : deleteFile(data),
        datastoreType : "memory",
        datastoreDescription: "",
        data 
    };
};