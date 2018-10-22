const loadJson = datastore => async key => 
    JSON.parse(await datastore.loadFile(key));

const createJson = datastore => async (key, obj) =>
    await datastore.createFile(key, JSON.stringify(obj));

const updateJson = datastore => async (key, obj) =>
    await datastore.updateFile(key, JSON.stringify(obj));

export const setupDatastore = (datastore) => {
    datastore.loadJson = loadJson(datastore);
    datastore.createJson = createJson(datastore);
    datastore.updateJson = updateJson(datastore);
    return datastore;
};

export {createEventAggregator} from "./eventAggregator";

export default setupDatastore;
