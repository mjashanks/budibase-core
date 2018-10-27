import {union, reduce} from "lodash/fp";

const commonPlus = (extra) => 
    union(["onBegin", "onComplete", "onError"])
    (extra);

const common = () => commonPlus([]);

const _events = {
    recordApi : {
        save: commonPlus([
            "onInvalid",
            "onRecordUpdated",
            "onRecordCreated"]),
        delete: common(),
        getContext: common(),
        getNew: common(),
        load: common(),
        validate: common()
    },
    viewApi : {
        buildIndex: common(),
        listItems: common()
    },
    collectionApi: {
        getAllowedRecordTypes: common(),
        initialise: common(),
        listRecords: common()
    }
}

for(let areaKey in _events) {
    for(let methodKey in _events[areaKey]) {
        _events[areaKey][methodKey] = 
            reduce((obj,s) => {
                obj[s] = `${areaKey}:${methodKey}:${s}`;
                return obj;
            }
              ,{})
            (_events[areaKey][methodKey]);
    }
}

export const events = _events;
export default _events;