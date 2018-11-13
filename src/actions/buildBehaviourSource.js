import {has} from "lodash";

export const createBehaviourSources = () => ({
    register: (name, funcsObj) => {
        if(has(this, name)) {
            throw new Error(`Source '${name}' already exists`);
        }

        this[name] = funcsObj;
    }
})