import {isUndefined, has} from "lodash";
import {Readable, Writable} from "readable-stream";
import { Buffer } from "safe-buffer";

const folderMarker = "-FOLDER-";
const isFolder = val => val === folderMarker;

export const createFile = data => async (path, content) => {
    if(await exists(data)(path)) throw new Error(path + " already exists");
    data[path] = content;
};
export const updateFile = data => async (path, content) => {
    // putting this check in to force use of create
    if(!await exists(data)(path)) throw new Error("cannot update " + path + " - does not exist"); 
    data[path] = content;
}

export const writableFileStream = data => async (path) => {
    if(!await exists(data)(path)) throw new Error("cannot write stream to " + path + " - does not exist"); 
    const stream = Writable();
    stream._write = (chunk, encoding, done) => {
        data[path] = [...data[path], ...chunk];
        done();
    };
    return stream;
};

export const readableFileStream = data => async (path) => {
    if(!await exists(data)(path)) throw new Error("cannot read stream from " + path + " - does not exist"); 
    const s = new Readable();
    s._read = () => {
        s.push(Buffer.from(data[path]));
        s.push(null);
    }; 
    return s;
};

export const loadFile = data => async (path) => {
    const result = data[path];
    if(isUndefined(result)) throw new Error("Load failed - path " + path + " does not exist");
    return result;
};
export const exists = data => async (path) => has(data, path);
export const deleteFile = data => async (path) => {
    if(!await exists(data)(path)) 
        throw new Error("Cannot delete file, path " + path + " does not exist");
    if(isFolder(data[path])) throw new Error("DeleteFile: Path " + path + " is a folder, not a file");
    delete data[path];
}
export const createFolder = data => async (path) => {
    if(await exists(data)(path)) throw new Error("Cannot create folder, path " + path + " already exists");
    data[path] = folderMarker; // does nothing really
}
export const deleteFolder = data => async (path) => {
    if(!await exists(data)(path)) throw new Error("Cannot delete folder, path " + path + " does not exist");
    if(!isFolder(data[path])) throw new Error("DeleteFolder: Path " + path + " is not a folder");
    delete data[path];
} 

export default data => {
    return {
        createFile : createFile(data),
        updateFile : updateFile(data),
        loadFile : loadFile(data),
        exists : exists(data),
        deleteFile : deleteFile(data),
        createFolder: createFolder(data),
        deleteFolder: deleteFolder(data),
        readableFileStream: readableFileStream(data),
        writableFileStream: writableFileStream(data),
        datastoreType : "memory",
        datastoreDescription: "",
        data 
    };
};