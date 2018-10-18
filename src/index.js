import getRecordApi from "./recordApi";
import getCollectionApi from "./collectionApi";
import getViewApi from "./viewApi";
import getTemplateApi from "./templateApi";
import {setupDatastore} from "./datastores";
import {isSomething} from "./common";

export const getAppApis = async store => {

    store = setupDatastore(store);
    const templateApi = getTemplateApi(store);
    const appHeirarchy = await templateApi.getApplicationHeirarchy();
    const app = {heirarchy:appHeirarchy, datastore:store};
    const recordApi = getRecordApi(app);
    const collectionApi = getCollectionApi(app);
    const viewApi = getViewApi(app);

    return ({
        recordApi, 
        templateApi,
        collectionApi,
        viewApi});
};

export {getTemplateApi} from "./templateApi";
export {getRecordApi} from "./recordApi";
export {getCollectionApi} from "./collectionApi";
export {getViewApi} from "./viewApi";


export default getAppApis;