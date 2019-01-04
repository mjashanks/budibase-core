import {generateSchema} from "./indexSchemaCreator";
import { has, isUndefined } from "lodash/fp";
import { Buffer } from "safe-buffer";
import {StringDecoder} from "string_decoder";
import {getType} from "../types";

export const BUFFER_MAX_BYTES = 524288; // 0.5Mb

export const CONTINUE_READING_RECORDS = "CONTINUE_READING";
export const READ_REMAINING_TEXT = "READ_REMAINING";
export const CANCEL_READ = "CANCEL";

export const getIndexWriter = (heirarchy, indexNode, getNextInputBytes, flushOutputBuffer) => {
    const schema = generateSchema(heirarchy, indexNode);

    return ({
        read: read(getNextInputBytes, schema),
        addItem: addItem(getNextInputBytes, flushOutputBuffer, schema),
        removeItem: removeItem(getNextInputBytes, flushOutputBuffer, schema),
        updateItem: updateItem(getNextInputBytes, flushOutputBuffer, schema)
    });
};

export const getIndexReader = (heirarchy, indexNode, getNextInputBytes) => 
    read(
        getNextInputBytes, 
        generateSchema(heirarchy, indexNode)
    );


const addItem = (getNextInputBytes, flushOutputBuffer, schema) => (item) => {
    const write = newOutputWriter(BUFFER_MAX_BYTES, flushOutputBuffer);
    let hasWritten = false;
    const serializedItem = serializeItem(schema, item);
    read(getNextInputBytes, schema)(
        indexedItem => {
            let status = CONTINUE_READING_RECORDS;
            if(indexedItem.sortKey > item.sortKey) {
                write(serializedItem);
                hasWritten = true;
                status = READ_REMAINING_TEXT;
            }

            write(
                serializeItem(schema, indexedItem)
            );

            return status;            
        },
        text => write(text));

    if(!hasWritten)
        write(serializedItem);

    write();
};

const removeItem = (getNextInputBytes, flushOutputBuffer, schema) => (itemKey) => {
    const write = newOutputWriter(BUFFER_MAX_BYTES, flushOutputBuffer);
    read(getNextInputBytes, schema)(
        indexedItem => {
            if(indexedItem.key !== itemKey) {
                write(
                    serializeItem(schema, indexedItem)
                );
                return CONTINUE_READING_RECORDS;
            } else {
                return READ_REMAINING_TEXT;
            }
        },
        text => write(text)
    );
    write();
};

const updateItem = (getNextInputBytes, flushOutputBuffer, schema) => (item) => {
    const write = newOutputWriter(BUFFER_MAX_BYTES, flushOutputBuffer);
    let hasWritten = false;
    const serializedItem =  serializeItem(schema, item);
    read(getNextInputBytes, schema)(
        indexedItem => {
            if(indexedItem.key === item.key) {
                write(serializedItem);
                hasWritten = true;
                return READ_REMAINING_TEXT;
            } else {
               write(
                   serializeItem(schema, item)
               );
               return CONTINUE_READING_RECORDS;
            }
        },
        text => write(text)
    );
    
    if(!hasWritten)
        write(serializedItem);

    write();
};

const read = (getNextInputBytes, schema) => (onGetItem, onGetText) => {
    const readInput = newInputReader(getNextInputBytes);
    let text = readInput();
    let status = CONTINUE_READING_RECORDS;
    while(text.length > 0) {

        if(status === READ_REMAINING_TEXT) {
            onGetText(text);
            continue;
        }

        if(status === CANCEL_READ) {
            return;
        }

        let rowText = "";
        for(let currentChar of text) {
            rowText += currentChar;
            if(currentChar === "\r") {
                status = onGetItem(
                    deserializeRow(schema, rowText)
                );
                currentRowText = "";
            }
        }
        text = readInput();
    }
};

const newOutputWriter = (flushBoundary, flush) => {
    
    let currentBuffer = null;

    return (text) => {

        if(!!text && currentBuffer === null)
            currentBuffer = Buffer.from(text, "utf8");
        else if(!!text)
            currentBuffer = Buffer.concat([
                currentBuffer,
                Buffer.from(text, "utf8")
            ]);
        
        if(currentBuffer.length > 0 &&
            (currentBuffer.length > flushBoundary
             || !text)) {

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

const itemSeserializer = (heirarchy, indexNode) => {
    const schema = generateSchema(heirarchy, indexNode);
    return  ({
        deserializeRow: deserializeRow(schema),
        serializeItem: serializeRow(schema)
    });
};

const deserializeRow = (schema, rowText) => {
    let currentPropIndex = 0;
    let currentCharIndex = 0;
    let currentValueText = "";
    let isEscaped = false;
    const item = {};

    setCurrentProp = () => {
        const currentProp = schema[currentPropIndex];
        const value = currentValueText === ""
                      ? currentProp.type.getDefaultValue()
                      : currentProp.type.safeParseValue(
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

const serializeItem = (schema, item)  => {

    let rowText = ""

    for(let prop of schema) {
        const value = has(prop.name)(item)
                      ? item[prop.name]
                      : prop.type.getDefaultValue()
        
        const valStr = prop.type.stringify(value);

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