import {buildIndex} from "./buildIndex";
import {listItems} from "./listItems";
import {deleteView} from "./delete";

export const getViewApi = app => ({
    listItems : listItems(app), 
    buildIndex: buildIndex(app),
    delete: deleteView(app),
    _store : app.datastore
});

export default getViewApi;