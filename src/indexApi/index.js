import {buildIndex} from "./buildIndex";
import {listItems} from "./listItems";
import {deleteIndex} from "./delete";

export const getIndexApi = app => ({
    listItems : listItems(app), 
    buildIndex: buildIndex(app),
    delete: deleteIndex(app),
    _store : app.datastore
});

export default getIndexApi;