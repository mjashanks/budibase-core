import {authenticate, 
    authenticateTemporaryAccess} from "./authenticate";
import {createTemporaryAccess} from "./createTemporaryAccess";
import {createUser} from "./createUser";
import {enableUser, disableUser} from "./enableUser";
import {loadAccessLevels} from "./loadAccessLevels";
import {getNewAccessLevel} from "./getNewAccessLevel";
import {getNewUser} from "./getNewUser";
import {getUsers} from "./getUsers";
import {isAuthorized} from "./isAuthorized";
import {saveAccessLevels} from "./saveAccessLevels";
import {changeMyPassword, changePassword,
    scorePassword, setPasswordFromTemporaryCode, 
    isValidPassword} from "./setPassword";
import {validateUser} from "./validateUser";
import {validateAccessLevels} from "./validateAccessLevels";

export const getAuthApi = app => ({
    authenticate: authenticate(app),
    authenticateTemporaryAccess: authenticateTemporaryAccess(app),
    createTemporaryAccess: createTemporaryAccess(app),
    createUser: createUser(app),
    loadAccessLevels: loadAccessLevels(app),
    enableUser: enableUser(app),
    disableUser: disableUser(app),
    getNewAccessLevel: getNewAccessLevel(app),
    getNewUser: getNewUser(app),
    getUsers: getUsers(app),
    saveAccessLevels: saveAccessLevels(app),
    isAuthorized: isAuthorized(app),
    changeMyPassword: changeMyPassword(app),
    setPasswordFromTemporaryCode: setPasswordFromTemporaryCode(app),
    scorePassword,
    isValidPassword: isValidPassword(app),
    validateUser: validateUser(app),
    validateAccessLevels: validateAccessLevels(app)
});

export default getAuthApi;