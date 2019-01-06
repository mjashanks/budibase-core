import {merge, has} from "lodash";
import {constant, isUndefined, keys, 
    map, filter, reduce, mapValues, 
    isNull, cloneDeep} from "lodash/fp";
import {$, isNotEmpty} from "../common"

export const getSafeFieldParser = (tryParse, defaultValueFunctions) => (field, record) => {
    if(has(record, field.name)) {
        return getSafeValueParser(tryParse, defaultValueFunctions)
                                 (record[field.name]);
                        
    } else {
        return defaultValueFunctions[field.getUndefinedValue]();
    }
}

export const getSafeValueParser = (tryParse, defaultValueFunctions) => value => {
    const parsed = tryParse(value);
    if(parsed.success) {
        return parsed.value;
    } else {
        return defaultValueFunctions["default"]();
    }
}

export const getNewValue = (tryParse, defaultValueFunctions) => field => {
    const getInitialValue = isUndefined(field) || isUndefined(field.getInitialValue) 
                            ? "default" 
                            : field.getInitialValue;

    return has(defaultValueFunctions, getInitialValue)
           ? defaultValueFunctions[getInitialValue]()
           : getSafeValueParser(tryParse, defaultValueFunctions)(getInitialValue);
};

export const typeFunctions = specificFunctions => 
    merge({
        value: constant,
        null: constant(null)
    }, specificFunctions);

export const validateTypeConstraints = (validationRules, options) => 
(field, record, context) => {
    const safeTypeOptions = $(field.typeOptions, [
        keys,
        reduce((defaultOpts, opt) => {
            const actualValue = field.typeOptions[opt];
            const safeVal = 
                isNull(field.typeOptions[opt])  
                ? options[opt].valueIfNull
                : actualValue;
            defaultOpts[opt] = safeVal; 
            return defaultOpts;
        }, {})
    ]);
    const fieldValue = record[field.name];
    const validateRule = r => 
        !r.isValid(fieldValue, safeTypeOptions, context) 
        ? r.getMessage(fieldValue, safeTypeOptions) 
        : "";

    return $(validationRules, [
        map(validateRule),
        filter(isNotEmpty)
    ]);
}

const getDefaultOptions = mapValues(v => v.defaultValue)

export const makerule = (isValid, getMessage) => ({isValid, getMessage});
export const parsedFailed = val => ({success:false, value:val});
export const parsedSuccess = val => ({success:true, value:val});
export const getDefaultExport = (name, tryParse, functions, options, validationRules, sampleValue, stringify) => ({
    getNew : getNewValue(tryParse, functions), 
    safeParseField: getSafeFieldParser(tryParse, functions), 
    safeParseValue: getSafeValueParser(tryParse, functions),
    tryParse, 
    name,
    getDefaultOptions : () => getDefaultOptions(cloneDeep(options)), 
    validateTypeConstraints : validateTypeConstraints(validationRules, options),
    sampleValue,
    stringify: val => val === null || val === undefined 
                      ? "" : stringify(val),
    getDefaultValue: functions.default
});

