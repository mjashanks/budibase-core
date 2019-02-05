import {generateSchema} from "./indexSchemaCreator";
import { has, isString, difference, find } from "lodash/fp";
import { Buffer } from "safe-buffer";
import {StringDecoder} from "string_decoder";
import {getType} from "../types";
import { isSomething } from "../common";

export const BUFFER_MAX_BYTES = 524288; // 0.5Mb

export const CONTINUE_READING_RECORDS = "CONTINUE_READING";
export const READ_REMAINING_TEXT = "READ_REMAINING";
export const CANCEL_READ = "CANCEL";

export const getIndexWriter = (heirarchy, indexNode, getNextInputBytes, flushOutputBuffer) => {
    const schema = generateSchema(heirarchy, indexNode);

    return ({
        read: read(getNextInputBytes, schema),
        updateIndex: updateIndex(getNextInputBytes, flushOutputBuffer, schema)
    });
};

export const getIndexReader = (heirarchy, indexNode, getNextInputBytes) => 
    read(
        getNextInputBytes, 
        generateSchema(heirarchy, indexNode)
    );

const updateIndex = (getNextInputBytes, flushOutputBuffer, schema) => (itemsToWrite, keysToRemove) => {
    const write = newOutputWriter(BUFFER_MAX_BYTES, flushOutputBuffer);
    const writtenItems = []; 
    read(getNextInputBytes, schema)(
        indexedItem => {
            const updated = find(i => indexedItem.key === i.key)(itemsToWrite);
            const removed = find(k => indexedItem.key === k)(keysToRemove);
            
            if(isSomething(removed)) 
                return CONTINUE_READING_RECORDS;

            if(isSomething(updated)) {
                const serializedItem =  serializeItem(schema, updated);
                write(serializedItem);
                writtenItems.push(updated);
            } else {
                write(
                    serializeItem(schema, indexedItem)
                );
            } 

            return CONTINUE_READING_RECORDS;

        },
        text => write(text)
    );

    if(writtenItems.length !== itemsToWrite.length) {
        const toAdd = difference(itemsToWrite, writtenItems);
        for(let added of toAdd) {
            write(
                serializeItem(schema, added)
            );
        }
    }

    write();
};

const read = (getNextInputBytes, schema) => (onGetItem, onGetText) => {
    const readInput = newInputReader(getNextInputBytes);
    let text = readInput();
    let status = CONTINUE_READING_RECORDS;
    while(text.length > 0) {

        if(status === READ_REMAINING_TEXT) {
            onGetText(text);
            hasContent = true;
            continue;
        }

        if(status === CANCEL_READ) {
            return;
        }

        let rowText = "";
        let currentCharIndex=0;
        for(let currentChar of text) {
            rowText += currentChar;
            if(currentChar === "\r") {
                status = onGetItem(
                    deserializeRow(schema, rowText)
                );
                rowText = "";
                if(status === READ_REMAINING_TEXT) {
                    break;
                }
            }
            currentCharIndex++;
        }

        if(currentCharIndex < text.length -1) {
            onGetText(text.substring(currentCharIndex + 1));
        }

        text = readInput();
    }
};

const newOutputWriter = (flushBoundary, flush) => {
    
    let currentBuffer = null;

    return (text) => {

        if(isString(text) && currentBuffer === null)
            currentBuffer = Buffer.from(text, "utf8");
        else if(isString(text))
            currentBuffer = Buffer.concat([
                currentBuffer,
                Buffer.from(text, "utf8")
            ]);
        
        if(currentBuffer !== null &&
            (currentBuffer.length > flushBoundary
             || !isString(text))) {

            flush(currentBuffer);
            currentBuffer = null;
        }
    }
};

const newInputReader = (getNextInputBytes) => {

    const decoder = new StringDecoder('utf8');
    let remainingBytes = [];

    return () => {
        const nextBytes = getNextInputBytes();
        const frombytes = [...remainingBytes, ...(!nextBytes ? [] : nextBytes)];
        if(frombytes.length === remainingBytes.length)
            return "";
        const buffer = Buffer.from(frombytes);
        const text = decoder.write(buffer);
        remainingBytes = decoder.end(buffer);
        return text;
    };
};

const deserializeRow = (schema, rowText) => {
    let currentPropIndex = 0;
    let currentCharIndex = 0;
    let currentValueText = "";
    let isEscaped = false;
    const item = {};

    const setCurrentProp = () => {
        const currentProp = schema[currentPropIndex];
        const type = getType(currentProp.type);
        const value = currentValueText === ""
                      ? type.getDefaultValue()
                      : type.safeParseValue(
                          currentValueText);
        item[currentProp.name] = value;
    };
    
    while(currentPropIndex < schema.length) {

        if(currentCharIndex < rowText.length) {
            const currentChar = rowText[currentCharIndex];
            if(isEscaped) {
                if(currentChar === "r") {
                    currentValueText += "\r";
                } else {
                    currentValueText += currentChar;
                }
                isEscaped = false;
            } else {
                if(currentChar === ",") {
                    setCurrentProp();
                    currentValueText = "";
                    currentPropIndex++;
                } else if(currentChar === "\\") {
                    isEscaped = true;
                } else {
                    currentValueText += currentChar;
                }
            }
            currentCharIndex++; 
        } else {
            currentValueText = "";
            setCurrentProp();
            currentPropIndex++;
        }
    }

    return item;
};

export const serializeItem = (schema, item)  => {

    let rowText = ""

    for(let prop of schema) {
        const type = getType(prop.type);
        const value = has(prop.name)(item)
                      ? item[prop.name]
                      : type.getDefaultValue()
        
        const valStr = type.stringify(value);

        for(let i = 0; i < valStr.length; i++) {
            const currentChar = valStr[i];
            if(currentChar === "," 
               || currentChar === "\r" 
               || currentChar === "\\") {
                rowText += "\\";
            }

            if(currentChar === "\r") {
                rowText += "r";
            } else {
                rowText += currentChar;
            }
        }

        rowText += ",";
    }

    rowText += "\r";
    return rowText;
};