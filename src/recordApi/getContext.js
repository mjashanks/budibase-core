import {getExactNodeForPath, findField, getNode} from "../templateApi/heirarchy";
import {getIndexedDataKey} from "../indexing/read";
import {listItems} from "../indexApi/listItems";
import {has, some} from "lodash";
import {map} from "lodash/fp";
import {$, apiWrapper, events} from "../common";

export const getContext = app => recordKey => 
    apiWrapper(
        app,
        events.recordApi.getContext, 
        {recordKey},
        _getContext, app, recordKey);

const _getContext = (app, recordKey) => {

    const recordNode = getExactNodeForPath(app.heirarchy)(recordKey);    

    const cachedReferenceIndexes = {};

    const lazyLoadReferenceIndex = async fieldName => {
        
        const field = findField(recordNode, fieldName);

        if(!has(cachedReferenceIndexes, fieldName)) {
            cachedReferenceIndexes[fieldName] = {
                field: field,
                data: await readReferenceIndex(
                        app, recordKey, field)
            }
                    
        }

        return cachedReferenceIndexes[fieldName];
    }

    return {
        referenceExists : async (fieldName, key) => {
            const {data} = await lazyLoadReferenceIndex(fieldName);
            return some(data, i => i.key === key);
        },
        referenceOptions: async (fieldName) => {
            const {data} = await lazyLoadReferenceIndex(fieldName);
            return data;
        },
        recordNode
    };
}

const readReferenceIndex = async (app, recordKey,field) => {
    const indexNode = getNode(app.heirarchy, field.typeOptions.indexNodeKey);
    const indexedDataKey = getIndexedDataKey(recordKey, indexNode);
    const items = await listItems(app)(indexedDataKey);
    return $(items, [
        map(i => ({
            key: i.key,
            value: i[field.typeOptions.displayValue]
        }))
    ]);
 }