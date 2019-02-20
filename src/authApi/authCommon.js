import {joinKey} from "../common";
import {clone, find} from "lodash/fp";
// 5 minutes
export const tempCodeExpiryLength = 5 * 60 * 60;

export const AUTH_FOLDER = "/.auth";
export const USERS_LIST_FILE = joinKey(AUTH_FOLDER, "users.json");
export const userAuthFile= username => joinKey(AUTH_FOLDER, `auth_${username}.json`);
export const USERS_LOCK_FILE = joinKey(AUTH_FOLDER, "users_lock");
export const ACCESS_LEVELS_FILE = joinKey(AUTH_FOLDER, "access_levels.json");
export const ACCESS_LEVELS_LOCK_FILE = joinKey(AUTH_FOLDER, "access_levels_lock");

export const BLACKLIST = "blacklist";
export const WHITELIST = "whitelist";
export const isBlacklist = type => type === BLACKLIST;
export const isWhitelist = type => type === WHITELIST;

export const CREATE_RECORD = "create record";
export const UPDATE_RECORD = "update record";
export const READ_RECORD = "update record";
export const DELETE_RECORD = "delete record";
export const READ_INDEX = "read index";
export const WRITE_TEMPLATES = "write templates";
export const CREATE_USER = "create user";
export const SET_PASSWORD = "set password";
export const CREATE_TEMPORARY_ACCESS = "create temporary access";
export const ENABLE_DISABLE_USER = "enable or disable user";
export const WRITE_ACCESS_LEVELS = "write access levels";
export const LIST_USERS = "list users";
export const LIST_ACCESS_LEVELS = "list access levels";

export const getUserByName = (users, name) => $(users, [
    find(u => u.name.toLowerCase() === name.toLowerCase())
]);

export const stripUserOfSensitiveStuff = user => {
    const stripped = clone(user);
    delete stripped.temporaryAccessId
    return stripped;
}