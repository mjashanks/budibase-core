import getRecordApi from "./recordApi";
import getCollectionApi from "./collectionApi";
import getIndexApi from "./indexApi";
import getTemplateApi from "./templateApi";
import {setupDatastore, createEventAggregator} from "./appInitialise";
import {initialiseActions} from "./actions"
import {isSomething} from "./common";
import {cleanup} from "./transactions/cleanup";

export const getAppApis = async (store, behaviourSources = {}, cleanupTransactions = null, getEpochTime = null) => {

    store = setupDatastore(store);
    const templateApi = getTemplateApi(store);
    const appDefinition = await templateApi.getApplicationDefinition();
    const eventAggregator = createEventAggregator();

    const actions = initialiseActions(
        eventAggregator.subscribe,
        behaviourSources,
        appDefinition.actions,
        appDefinition.triggers);

    const app = {
        heirarchy:appDefinition.heirarchy, 
        actions:appDefinition.actions,
        datastore:store, 
        publish:eventAggregator.publish
    };

    app.cleanupTransactions = isSomething(cleanupTransactions) 
                              ? cleanupTransactions
                              : async () => cleanup(app);

    app.getEpochTime = isSomething(getEpochTime)
                       ? getEpochTime
                       : async () => (new Date()).getTime();

    const recordApi = getRecordApi(app);
    const collectionApi = getCollectionApi(app);
    const indexApi = getIndexApi(app);

    return ({
        recordApi, 
        templateApi,
        collectionApi,
        indexApi,
        subscribe: eventAggregator.subscribe,
        actions
    });
};

export {events, eventsList} from "./common/events";

export {getTemplateApi} from "./templateApi";
export {getRecordApi} from "./recordApi";
export {getCollectionApi} from "./collectionApi";
export {getIndexApi} from "./indexApi";
export {setupDatastore} from "./appInitialise";

export default getAppApis;