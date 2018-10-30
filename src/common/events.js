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

const _eventsList = [];

const makeEvent = (area,  method, name) =>
    `${area}:${method}:${name}`;

for(let areaKey in _events) {
    for(let methodKey in _events[areaKey]) {
        _events[areaKey][methodKey] = 
            reduce((obj,s) => {
                obj[s] = makeEvent(areaKey,methodKey,s);
                return obj;
            }
              ,{})
            (_events[areaKey][methodKey]);
    }
}


for(let areaKey in _events) {
    for(let methodKey in _events[areaKey]) {
        for(let name in _events[areaKey][methodKey]) {
            _eventsList.push(
                _events[areaKey][methodKey][name]
            );
        }
    }
}


export const events = _events;

export const eventsList = _eventsList;

export default {events:_events, eventsList:_eventsList};