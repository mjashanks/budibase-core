import indexing from "../indexing";
import {getNew, getNewChild} from "./getNew";
import {load} from "./load";
import {validate} from "./validate";
import {getContext} from "./getContext";
import {save} from "./save";
import {deleteRecord} from "./delete";

const api = app => {
    const indexingApi = indexing(app);
    return ({
        getNew : getNew(app), 
        getNewChild: getNewChild(app),
        save: save(app, indexingApi), 
        load: load(app, indexingApi), 
        delete: deleteRecord(app, false),
        validate: validate(app),
        getContext: getContext(app),
        _storeHandle : app.datastore
    });
};


export const getRecordApi = (app) => 
    api(app);

export default getRecordApi;
