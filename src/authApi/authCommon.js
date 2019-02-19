import {joinKey} from "../common";
import {clone, find} from "lodash/fp";
// 5 minutes
export const tempCodeExpiryLength = 5 * 60 * 60;

export const AUTH_FOLDER = "/.auth";
export const USERS_LIST_FILE = joinKey(AUTH_FOLDER, "users.json");
export const USERS_LOCK_FILE = joinKey(AUTH_FOLDER, "users_lock");
export const ACCESS_LEVELS_FILE = joinKey(AUTH_FOLDER, "access_levels.json");
export const ACCESS_LEVELS_LOCK_FILE = joinKey(AUTH_FOLDER, "access_levels_lock");

export const getUserByName = (users, name) => $(users, [
    find(u => u.name.toLowerCase() === name.toLowerCase())
]);

export const stripUserOfSensitiveStuff = user => {
    const stripped = clone(user);
    delete stripped.temporaryAccessHash
    delete stripped.temporaryAccessId
    delete stripped.passwordHash
    return stripped;
}