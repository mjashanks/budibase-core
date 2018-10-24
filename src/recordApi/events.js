import {event, onBegin, onComplete} from "../common";

const recordApi = event("recordApi")
const recordApiSave = recordApi("save");

export const onSaveBegin = recordApiSave(onBegin);
export const onSaveComplete = recordApiSave(onComplete);
export const onSaveInvalid = recordApiSave("onInvalid");
export const onRecordCreated = recordApiSave("onCreate");
export const onRecordUpdated = recordApiSave("onUpdate");

