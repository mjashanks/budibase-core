import getRecordApi from "./recordApi";
import getCollectionApi from "./collectionApi";
import getViewApi from "./viewApi";
import getTemplateApi from "./templateApi";
import {setupDatastore, createEventAggregator} from "./appInitialise";

export const getAppApis = async (store) => {

    store = setupDatastore(store);
    const templateApi = getTemplateApi(store);
    const appDefinition = await templateApi.getApplicationDefinition();
    const eventAggregator = createEventAggregator();

    subscribeActions(appDefinition.actions, eventAggregator);

    const app = {
        heirarchy:appDefinition.heirarchy, 
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

// TODO: subscribe actions
const subscribeActions = (actions, eventAggregator) => {
    for(let a of actions) {
        eventAggregator.subscribe(a.eventName, () => {
            throw new Error("Please implement action execution !!!");
        });
    }
}

export {events, eventsList} from "./common/events";

export {getTemplateApi} from "./templateApi";
export {getRecordApi} from "./recordApi";
export {getCollectionApi} from "./collectionApi";
export {getViewApi} from "./viewApi";
export {setupDatastore} from "./appInitialise";

export default getAppApis;