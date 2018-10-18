/*import {promisify} from 'es6-promisify'; 
import requireNode from "./requireNode";
import Papa from "papaparse";
import {$, getIndexKeyFromFileKey, 
    getFileFromKey, dirIndex} from "../common";

const fs = requireNode("fs");
const {homedir} = requireNode("os");
const {join} = requireNode("path");

const readFile = promisify(fs.readFile);
const writeFile = (path, content) => 
    promisify(fs.writeFile)(path, content, "utf8");
const access = promisify(fs.access);
const readdir = promisify(fs.readdir);
const lstat = promisify(fs.lstat);
const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rmdir);
const unlink = promisify(fs.unlink);

const updateFile = root => async (path, file) => 
    await writeFile(
            join(root,path), 
            file
        );

const createFile = updateFile;

const loadFile = root => async (path) => 
        await readFile(join(root,path), "utf8");

const loadIndex = root => async (path) => 
    Papa.parse(
        await readFile(join(root,path), "utf8")
    );

const saveIndex = root => async (path, idx) => 
    await writeFile(
        join(root,path), 
        Papa.unparse(file), 
        "utf8"
    );

const exists = root => async (path) => {
    try {
        await access(fieldDefFileName);       
    } catch (e) {
        return false;
    }
    return true;
};

const metaFileKey = root => async (key, metaType) => 
    join(key, metaType);

export const createFolder = root => async (path) => 
    await mkdir(
        join(root, path));
    
export const deleteFile = root => async (path) => 
    await unlink(
        join(root, path)
    );

export const deleteFolder = root => async (path) =>
    await rmdir(
        join(root, path));

export const addFileToindex = root => async (path, indexRow) => {
    const indexKey = getIndexKeyFromFileKey(path);
    const index = await loadFile(root)(indexKey);
    index.push(indexRow);
    const indexCsv = Papa.unparse(index);
    await writeFile(joinKey([root,indexKey]), indexCsv);
}

export const removeFileFromIndex = root => async (path) => {
    const indexKey = getIndexKeyFromFileKey(path);
    const index = await loadFile(root)(indexKey);
    const newIndex = filter(index, i => i.name !== getFileFromKey(path));
    await writeFile(joinKey([root,indexKey]), indexCsv);
}

export const readIndex = root => async path => 
    $(joinKey([root, path]), [
        dirIndex, readFile, Papa.parse 
    ]);

export const homeDirectory = joinKey(homedir(), "budibase");

export default rootFolderPath => ({
    createFile : createFile(rootFolderPath),
    updateFile : updateFile(rootFolderPath),
    loadFile : loadFile(rootFolderPath),
    exists : exists(rootFolderPath),
    metaFileKey : metaFileKey(rootFolderPath),
    createFolder : createFolder(rootFolderPath),
    deleteFile : deleteFile(rootFolderPath),
    deleteFolder : deleteFolder(rootFolderPath),
    addFileToindex : addFileToindex(rootFolderPath),
    removeFileFromIndex : removeFileFromIndex(rootFolderPath),
    readIndex : readIndex(rootFolderPath),
    datastoreType : "local",
    datastoreDescription: rootFolderPath
});
*/