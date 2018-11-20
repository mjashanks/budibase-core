import path from "path";
import {getAppApis, getRecordApi, 
    getCollectionApi, getIndexApi}  from "../src";
import memory from "../src/appInitialise/memory";
import {setupDatastore} from "../src/appInitialise";
import {configFolder, fieldDefinitions, 
    templateDefinitions,
    joinKey} from "../src/common";
import { getNewIndexTemplate } from "../src/templateApi/createNodes";
import getTemplateApi from "../src/templateApi";
import {createEventAggregator} from "../src/appInitialise/eventAggregator";
import {filter} from "lodash/fp";
import {createBehaviourSources} from "../src/actions/buildBehaviourSource";
import {createAction, createTrigger} from "../src/templateApi/createActions";

const exp = module.exports;

export const testFileArea = (testNameArea) => path.join("test", "fs_test_area", testNameArea);
export const testConfigFolder = (testAreaName) => path.join(exp.testFileArea(testAreaName), configFolder);
export const testFieldDefinitionsPath = (testAreaName) => path.join(exp.testFileArea(testAreaName), fieldDefinitions);
export const testTemplatesPath = (testAreaName) => path.join(exp.testFileArea(testAreaName), templateDefinitions);
 
export const getMemoryStore = () => setupDatastore(memory({}));
export const getMemoryTemplateApi = () => {
    const templateApi = getTemplateApi(getMemoryStore());
    templateApi._eventAggregator = createEventAggregator();
    return templateApi;
}

// TODO: subscribe actions
const appFromTempalteApi = async templateApi => ({
    heirarchy:(await templateApi.getApplicationDefinition()).heirarchy, 
    datastore:templateApi._storeHandle,
    publish:templateApi._eventAggregator.publish,
    _eventAggregator: templateApi._eventAggregator // not normally available to the apis
});

export const getRecordApiFromTemplateApi = async templateApi => 
    getRecordApi(await appFromTempalteApi(templateApi));

export const getCollectionApiFromTemplateApi = async templateApi => 
    getCollectionApi(await appFromTempalteApi(templateApi));

export const getIndexApiFromTemplateApi = async templateApi => 
    getIndexApi(await appFromTempalteApi(templateApi));

export const heirarchyFactory = (...additionalFeatures) => templateApi => {
    const root = templateApi.getNewRootLevel();

    const settingsRecord = templateApi.getNewRecordTemplate(root);
    settingsRecord.name = "settings";

    const customersCollection = templateApi.getNewCollectionTemplate(root);
    customersCollection.name = "customers";
    customersCollection.indexes[0].map = "return {surname:record.surname, isalive:record.isalive};";
    const customerRecord = templateApi.getNewRecordTemplate(customersCollection);
    customerRecord.name = "customer";

    const partnersCollection = templateApi.getNewCollectionTemplate(root);
    partnersCollection.name = "partners";
    
    const partnerRecord = templateApi.getNewRecordTemplate(partnersCollection);
    partnerRecord.name = "partner";

    const partnerInvoicesCollection = templateApi.getNewCollectionTemplate(partnerRecord);
    partnerInvoicesCollection.name = "invoices";

    const partnerInvoiceRecord  = templateApi.getNewRecordTemplate(partnerInvoicesCollection);
    partnerInvoiceRecord.name = "invoice";

    const invoicesCollection = templateApi.getNewCollectionTemplate(customerRecord);
    invoicesCollection.name = "invoices";
    invoicesCollection.indexes[0].map = "return {createdDate: record.createdDate, totalIncVat: record.totalIncVat};";
    const invoiceRecord = templateApi.getNewRecordTemplate(invoicesCollection);
    invoiceRecord.name = "invoice";
    
    const chargesCollection = templateApi.getNewCollectionTemplate(invoiceRecord);
    chargesCollection.name = "charges";
    const chargeRecord = templateApi.getNewRecordTemplate(chargesCollection);
    chargeRecord.name = "charge";

    const heirarchy = ({root, customersCollection, customerRecord,
            invoicesCollection, invoiceRecord, chargesCollection, 
            partnersCollection, partnerRecord, partnerInvoicesCollection,
            partnerInvoiceRecord, chargeRecord, settingsRecord});
    for(let feature of additionalFeatures) {
        feature(heirarchy, templateApi);
    }
    return heirarchy;
};

export const basicAppHeirarchyCreator = templateApis =>
    heirarchyFactory()(templateApis);

export const withFields = (heirarchy, templateApi) => {
    const {customerRecord, invoiceRecord, 
        partnerInvoiceRecord, chargeRecord,
        partnerRecord, partnersCollection, 
        settingsRecord} = heirarchy;

    getNewFieldAndAdd(templateApi, settingsRecord)("appName", "string", "");
    
    const newCustomerField = getNewFieldAndAdd(templateApi, customerRecord);


    const partnersReferenceIndex = templateApi.getNewIndexTemplate(partnersCollection);
    partnersReferenceIndex.name = "partnersReference";
    partnersReferenceIndex.map = "return {name:record.businessName};";

    const partnerCustomersReverseIndex = templateApi.getNewIndexTemplate(partnerRecord);
    partnerCustomersReverseIndex.name = "partnerCustomers";
    partnerCustomersReverseIndex.map = "return {...record};";
    heirarchy.partnerCustomersReverseIndex = partnerCustomersReverseIndex;

    newCustomerField("surname", "string");
    newCustomerField("isalive", "bool");
    newCustomerField("createddate", "datetime");
    newCustomerField("age", "number");
    const customerPartnerField = newCustomerField("partner", "reference");
    customerPartnerField.typeOptions.indexNodeKey = "/partners/partnersRefererence";
    customerPartnerField.typeOptions.displayValue = "businessName";
    customerPartnerField.typeOptions.reverseIndexNodeKey = joinKey(
        partnerRecord.nodeKey(), "partnerCustomers" );

    const newInvoiceField = getNewFieldAndAdd(templateApi, invoiceRecord);

    newInvoiceField("totalIncVat", "number");
    newInvoiceField("createdDate", "datetime");
    newInvoiceField("paidAmount", "number");

    const newPartnerField = getNewFieldAndAdd(templateApi, partnerRecord);
    newPartnerField("businessName", "string");

    const newPartnerInvoiceField = getNewFieldAndAdd(templateApi, partnerInvoiceRecord);
    newPartnerInvoiceField("totalIncVat", "number");
    newPartnerInvoiceField("createdDate", "datetime");
    newPartnerInvoiceField("paidAmount", "number");

    const newChargeField = getNewFieldAndAdd(templateApi, chargeRecord);
    newChargeField("amount", "number");

    const customersReferenceIndex = templateApi.getNewIndexTemplate(heirarchy.root);
    customersReferenceIndex.name = "customersReference";
    customersReferenceIndex.map = "return {name:record.surname}";
    customersReferenceIndex.filter = "record.isalive === true";

    const invoiceCustomerField = newInvoiceField("customer", "reference");
    invoiceCustomerField.typeOptions.indexNodeKey = "/customersReference";
    invoiceCustomerField.typeOptions.displayValue = "name";
}

export const withIndexes = (heirarchy, templateApi) => {
    const {root, customersCollection} = heirarchy;
    const deceasedCustomersIndex = getNewIndexTemplate(customersCollection);
    deceasedCustomersIndex.name = "deceased";
    deceasedCustomersIndex.map = "return {surname: record.surname, age:record.age};";
    deceasedCustomersIndex.filter = "record.isalive === false";
    customersCollection.indexes[0].map = "return record;"

    const customerInvoicesIndex = getNewIndexTemplate(customersCollection);
    customerInvoicesIndex.name = "invoices";
    customerInvoicesIndex.map = "return record;";
    customerInvoicesIndex.filter = "record.type() === 'invoice'";

    const outstandingInvoicesIndex = getNewIndexTemplate(root);
    outstandingInvoicesIndex.name = "Outstanding Invoices";
    outstandingInvoicesIndex.filter = "record.type() === 'invoice' && record.paidAmount < record.totalIncVat";
    outstandingInvoicesIndex.map = "return record;";

    heirarchy.outstandingInvoicesIndex = outstandingInvoicesIndex;
    heirarchy.deceasedCustomersIndex = deceasedCustomersIndex;
    heirarchy.customerInvoicesIndex = customerInvoicesIndex;
}

export const basicAppHeirarchyCreator_WithFields = templateApi => 
    heirarchyFactory(withFields)(templateApi);
    
export const basicAppHeirarchyCreator_WithFields_AndIndexes = templateApi => 
    heirarchyFactory(withFields, withIndexes)(templateApi);

export const setupAppheirarchy = async creator => {
    const templateApi = getMemoryTemplateApi();
    const heirarchy = creator(templateApi);
    await templateApi.saveApplicationHeirarchy(heirarchy.root);
    const collectionApi = await getCollectionApiFromTemplateApi(templateApi);
    const indexApi = await getIndexApiFromTemplateApi(templateApi);
    await collectionApi.initialiseAll();
    return ({
        recordApi: await getRecordApiFromTemplateApi(templateApi),
        collectionApi,
        templateApi,
        indexApi,
        appHeirarchy:heirarchy,
        subscribe:templateApi._eventAggregator.subscribe
    });
};

export const getNewFieldAndAdd = (templateApi, record) => (name, type, initial) => {
    const field = templateApi.getNewField(type);
    field.name = name;
    field.getInitialValue = !initial ? "default" : initial;
    templateApi.addField(record, field);
    return field;
};

export const stubEventHandler = () => {
    const events = [];
    return {
        handle: (name, context) => {
            events.push({name, context});
        },
        events,
        getEvents: n => filter(e => e.name === n)
                              (events)
    };
};

export const createValidActionsAndTriggers = () => {
    const logMessage = createAction();
    logMessage.name = "logMessage";
    logMessage.behaviourName = "log";
    logMessage.behaviourSource = "budibase-behaviours";
    
    const measureCallTime = createAction();
    measureCallTime.name = "measureCallTime";
    measureCallTime.behaviourName = "call_timer";
    measureCallTime.behaviourSource = "budibase-behaviours";


    const sendEmail = createAction();
    sendEmail.name = "sendEmail";
    sendEmail.behaviourName = "send_email";
    sendEmail.behaviourSource = "my-custom-lib";

    const logOnErrorTrigger = createTrigger();
    logOnErrorTrigger.actionName = "logMessage";
    logOnErrorTrigger.eventName = "recordApi:save:onError";
    logOnErrorTrigger.optionsCreator = "return context.error.message;";

    const timeCustomerSaveTrigger = createTrigger();
    timeCustomerSaveTrigger.actionName = "measureCallTime";
    timeCustomerSaveTrigger.eventName = "recordApi:save:onComplete";
    timeCustomerSaveTrigger.optionsCreator = "return 999;";
    timeCustomerSaveTrigger.condition = "context.record.type() === 'customer'";

    const allActions = [logMessage, measureCallTime, sendEmail];
    const allTriggers = [logOnErrorTrigger, timeCustomerSaveTrigger];

    const behaviourSources = createBehaviourSources();
    const logs = [];
    const call_timers = [];
    const emails = [];
    behaviourSources.register("budibase-behaviours", {
        log: message => logs.push(message),
        call_timer: opts => call_timers.push(opts)
    });
    behaviourSources.register("my-custom-lib", {
        send_email: em => emails.push(em)
    });

    return {
        logMessage, measureCallTime, sendEmail,
        logOnErrorTrigger, timeCustomerSaveTrigger,
        allActions, allTriggers, behaviourSources,
        logs, call_timers, emails
    };
};
    

export const createAppDefinitionWithActionsAndTriggers = async () => {

    const {appHeirarchy, templateApi} = await setupAppheirarchy(
        basicAppHeirarchyCreator_WithFields
    );

    // adding validation rule so it can fail when we save it 
    templateApi.addRecordValidationRule(appHeirarchy.customerRecord)(
        templateApi.commonRecordValidationRules.fieldNotEmpty("surname")
    );

    await templateApi.saveApplicationHeirarchy(appHeirarchy.root);
    
    const actionsAndTriggers = createValidActionsAndTriggers();
    const {allActions, allTriggers} = actionsAndTriggers;
    await templateApi.saveActionsAndTriggers(allActions, allTriggers);
    const appDefinition = await templateApi.getApplicationDefinition();
    return {templateApi, appDefinition, ...actionsAndTriggers, ...appHeirarchy};
};
