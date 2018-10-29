import getRecordApi from "./recordApi";
import getCollectionApi from "./collectionApi";
import getViewApi from "./viewApi";
import getTemplateApi from "./templateApi";
import {setupDatastore, createEventAggregator} from "./appInitialise";

export const getAppApis = async (store) => {

    store = setupDatastore(store);
    const templateApi = getTemplateApi(store);
    const appHeirarchy = await templateApi.getApplicationHeirarchy();
    const eventAggregator = createEventAggregator();
    const app = {
        heirarchy:appHeirarchy, 
        datastore:store, 
        publish:eventAggregator.publish
    };
    const recordApi = getRecordApi(app);
    const collectionApi = getCollectionApi(app);
    const viewApi = getViewApi(app);

    return ({
        recordApi, 
        templateApi,
        collectionApi,
        viewApi,
        subscribe: eventAggregator.subscribe
    });
};

export {getTemplateApi} from "./templateApi";
export {getRecordApi} from "./recordApi";
export {getCollectionApi} from "./collectionApi";
export {getViewApi} from "./viewApi";

export default getAppApis;