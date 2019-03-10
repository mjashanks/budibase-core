import {executeAction} from "./execute";

export const getApi = app => {
    executeAction: executeAction(app)
};

export default getApi;