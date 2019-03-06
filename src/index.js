import getRecordApi from "./recordApi";
import getCollectionApi from "./collectionApi";
import getIndexApi from "./indexApi";
import getTemplateApi from "./templateApi";
import getAuthApi from "./authApi";
import {setupDatastore, createEventAggregator} from "./appInitialise";
import {initialiseActions} from "./actions"
import {isSomething} from "./common";
import {cleanup} from "./transactions/cleanup";
import {generateFullPermissions} from "./authApi/generateFullPermissions";

export const getAppApis = async (store, behaviourSources = {}, 
                                cleanupTransactions = null, 
                                getEpochTime = null,
                                crypto = null) => {

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
        publish:eventAggregator.publish,
        crypto
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
    const authApi = getAuthApi(app);

    const asUser = async (username, password) => {
        app.user = await authApi.authenticate(username, password);
    };

    const asFullAccess = () => {
        app.user = {
            name: "app",
            permissions : generateFullPermissions(app),
            isUser:false,
            temp:false
        }
    };

    return ({
        recordApi, 
        templateApi,
        collectionApi,
        indexApi,
        authApi,
        subscribe: eventAggregator.subscribe,
        actions,
        asUser,
        asFullAccess
    });
};

export {events, eventsList} from "./common/events";

export {getTemplateApi} from "./templateApi";
export {getRecordApi} from "./recordApi";
export {getCollectionApi} from "./collectionApi";
export {getIndexApi} from "./indexApi";
export {setupDatastore} from "./appInitialise";

export default getAppApis;