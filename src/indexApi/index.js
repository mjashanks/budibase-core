import {buildIndex} from "./buildIndex";
import {listItems} from "./listItems";
import {deleteIndex} from "./delete";
import {aggregates} from "./aggregates";

export const getIndexApi = app => ({
    listItems : listItems(app), 
    buildIndex: buildIndex(app),
    aggregates: aggregates(app),
    _store : app.datastore
});

export default getIndexApi;