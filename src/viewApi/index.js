import {buildIndex} from "./buildIndex";
import {listItems} from "./listItems";

export const getViewApi = app => ({
    listItems : listItems(app), 
    buildIndex: buildIndex(app),
    _store : app.datastore
});

export default getViewApi;