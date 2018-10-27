import {getExactNodeForPath, findField, getNode} from "../templateApi/heirarchy";
import {getIndexedDataKey} from "../indexing/read";
import {listItems} from "../viewApi/listItems";
import {has, some} from "lodash";
import {map} from "lodash/fp";
import {$, apiWrapper} from "../common";

export const getContext = app => recordKey => 
    apiWrapper(
        app,
        "recordApi","getContext", 
        {recordKey},
        _getContext, app, recordKey);

const _getContext = (app, recordKey) => {

    const recordNode = getExactNodeForPath(app.heirarchy)(recordKey);    

    const cachedReferenceViews = {};

    const lazyLoadReferenceView = async fieldName => {
        
        const field = findField(recordNode, fieldName);

        if(!has(cachedReferenceViews, fieldName)) {
            cachedReferenceViews[fieldName] = {
                field: field,
                data: await readReferenceView(
                        app, recordKey, field)
            }
                    
        }

        return cachedReferenceViews[fieldName];
    }

    return {
        referenceExists : async (fieldName, key) => {
            const {data} = await lazyLoadReferenceView(fieldName);
            return some(data, i => i.key === key);
        },
        referenceOptions: async (fieldName) => {
            const {data} = await lazyLoadReferenceView(fieldName);
            return data;
        },
        recordNode
    };
}

const readReferenceView = async (app, recordKey,field) => {
    const viewNode = getNode(app.heirarchy, field.typeOptions.viewNodeKey);
    const indexedDataKey = getIndexedDataKey(recordKey, viewNode);
    const items = await listItems(app)(indexedDataKey);
    return $(items, [
        map(i => ({
            key: i.key,
            value: i[field.typeOptions.displayValue]
        }))
    ]);
 }