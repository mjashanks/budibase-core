import {authenticate} from "./authenticate";
import {createTemporaryAccess} from "./createTemporaryAccess";
import {createUser} from "./createUser";
import {enableUser, disableUser} from "./enableUser";
import {getAccessLevels} from "./getAccessLevels";
import {getNewAccessLevel} from "./getNewAccessLevel";
import {getNewUser} from "./getNewUser";
import {getUsers} from "./getUsers";
import {isAuthorized} from "./isAuthorized";
import {saveAccessLevel} from "./saveAccessLevel";
import {setPassword} from "./setPassword";
import {validateUser} from "./validateUser";

export const getAuthApi = app => ({
    authenticate: authenticate(app),
    createTemporaryAccess: createTemporaryAccess(app),
    createUser: createUser(app),
    getAccessLevels: authenticate(getAccessLevels),
    enableUser: enableUser(app),
    disableUser: disableUser(app),
    getNewAccessLevel: getNewAccessLevel(app),
    getNewUser: getNewUser(app),
    getUsers: getUsers(app),
    saveAccessLevel: saveAccessLevel(app),
    isAuthorized: isAuthorized(app),
    setPassword: setPassword(app),
    validateUser: validateUser(app)
});

export default getAuthApi;