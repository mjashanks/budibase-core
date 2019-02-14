import {getNew, getNewChild} from "./getNew";
import {load} from "./load";
import {validate} from "./validate";
import {getContext} from "./getContext";
import {save} from "./save";
import {deleteRecord} from "./delete";

const api = app => {
    return ({
        getNew : getNew(app), 
        getNewChild: getNewChild(app),
        save: save(app), 
        load: load(app), 
        delete: deleteRecord(app, false),
        validate: validate(app),
        getContext: getContext(app),
        _storeHandle : app.datastore
    });
};


export const getRecordApi = (app) => 
    api(app);

export default getRecordApi;
