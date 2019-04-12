import path from "path";
import {getAppApis, getRecordApi, 
    getCollectionApi, getIndexApi, getActionsApi}  from "../src";
import memory from "./memory";
import {setupDatastore} from "../src/appInitialise";
import {configFolder, fieldDefinitions, 
    templateDefinitions, isNothing,
    joinKey,
    isSomething} from "../src/common";
import { getNewIndexTemplate } from "../src/templateApi/createNodes";
import {indexTypes} from "../src/templateApi/indexes";
import getTemplateApi from "../src/templateApi";
import {getApplicationDefinition} from "../src/templateApi/getApplicationDefinition";
import getAuthApi from "../src/authApi";
import {createEventAggregator} from "../src/appInitialise/eventAggregator";
import {filter, find} from "lodash/fp";
import {createBehaviourSources} from "../src/actionsApi/buildBehaviourSource";
import {createAction, createTrigger} from "../src/templateApi/createActions";
import {initialiseActions} from "../src/actionsApi/initialise";
import {cleanup} from "../src/transactions/cleanup";
import nodeCrypto from "./nodeCrypto";
import {permission} from "../src/authApi/permissions";
import {generateFullPermissions} from "../src/authApi/generateFullPermissions"
import {initialiseData} from "../src/appInitialise/initialiseData";

const exp = module.exports;

export const testFileArea = (testNameArea) => path.join("test", "fs_test_area", testNameArea);
export const testConfigFolder = (testAreaName) => path.join(exp.testFileArea(testAreaName), configFolder);
export const testFieldDefinitionsPath = (testAreaName) => path.join(exp.testFileArea(testAreaName), fieldDefinitions);
export const testTemplatesPath = (testAreaName) => path.join(exp.testFileArea(testAreaName), templateDefinitions);
 
export const getMemoryStore = () => setupDatastore(memory({}));
export const getMemoryTemplateApi = () => {
    const app = {
        datastore:getMemoryStore(),
        publish: () => {},
        getEpochTime : async () => (new Date()).getTime(),
        user:{name:"", permissions:[permission.writeTemplates.get()]}
    };
    app.removePermission = removePermission(app);
    app.withOnlyThisPermission = withOnlyThisPermission(app);
    app.withNoPermissions = withNoPermissions(app);
    const templateApi = getTemplateApi(app);
    templateApi._eventAggregator = createEventAggregator();
    templateApi._storeHandle = app.datastore;
    return {templateApi, app};
}

// TODO: subscribe actions
export const appFromTempalteApi = async (templateApi, disableCleanupTransactions=false) => {
    const appDef = await templateApi.getApplicationDefinition();
    const app = {
        heirarchy:appDef.heirarchy, 
        datastore:templateApi._storeHandle,
        publish:templateApi._eventAggregator.publish,
        _eventAggregator: templateApi._eventAggregator,
        getEpochTime : async () => (new Date()).getTime(),
        crypto:nodeCrypto,
        user:{name:"bob", permissions: []},
        actions:{}
    }; 
    app.removePermission = removePermission(app);
    app.withOnlyThisPermission = withOnlyThisPermission(app);
    app.withNoPermissions = withNoPermissions(app);

    const fullPermissions = generateFullPermissions(app);
    app.user.permissions = fullPermissions;

    if(disableCleanupTransactions)
        app.cleanupTransactions = async () => {};
    else
        app.cleanupTransactions = async () => await cleanup(app);
    return app;
};

const removePermission = app => perm => {
    app.user.permissions = filter(p => p.type !== perm.type 
                                       || (isSomething(perm.nodeKey)
                                           && perm.nodeKey !== p.nodeKey))
                                (app.user.permissions);
}

const withOnlyThisPermission = app => perm => 
    app.user.permissions = [perm];

const withNoPermissions = app => () => 
    app.user.permissions = [];

export const getRecordApiFromTemplateApi = async (templateApi, disableCleanupTransactions=false) => {
    const app = await appFromTempalteApi(templateApi, disableCleanupTransactions);
    const recordapi = getRecordApi();
    recordapi._storeHandle = app.datastore;
}

export const getCollectionApiFromTemplateApi = async (templateApi, disableCleanupTransactions=false) => 
    getCollectionApi(await appFromTempalteApi(templateApi, disableCleanupTransactions));

export const getIndexApiFromTemplateApi = async (templateApi, disableCleanupTransactions=false) => 
    getIndexApi(await appFromTempalteApi(templateApi, disableCleanupTransactions));

export const getAuthApiFromTemplateApi = async (templateApi, disableCleanupTransactions=false) => 
    getAuthApi(await appFromTempalteApi(templateApi, disableCleanupTransactions));

export const findIndex = (parentNode, name) => 
    find(i => i.name === name)(parentNode.indexes);

export const findCollectionDefaultIndex = (recordCollectionNode) => 
    findIndex(recordCollectionNode.parent(), recordCollectionNode.name + "_index");

export const heirarchyFactory = (...additionalFeatures) => templateApi => {
    const root = templateApi.getNewRootLevel();

    const settingsRecord = templateApi.getNewSingleRecordTemplate(root);
    settingsRecord.name = "settings";

    const customerRecord = templateApi.getNewRecordTemplate(root, "customer");
    customerRecord.collectionName = "customers";
    findCollectionDefaultIndex(customerRecord).map = "return {surname:record.surname, isalive:record.isalive};";
    
    const partnerRecord = templateApi.getNewRecordTemplate(root, "partner");
    partnerRecord.collectionName = "partners";

    const partnerInvoiceRecord  = templateApi.getNewRecordTemplate(partnerRecord, "invoice");
    partnerInvoiceRecord.collectionName = "invoices";
    findCollectionDefaultIndex(partnerInvoiceRecord).name = "partnerInvoices_index";

    const invoiceRecord = templateApi.getNewRecordTemplate(customerRecord, "invoice");
    invoiceRecord.collectionName = "invoices";
    findCollectionDefaultIndex(invoiceRecord).map = "return {createdDate: record.createdDate, totalIncVat: record.totalIncVat};";

    const chargeRecord = templateApi.getNewRecordTemplate(invoiceRecord, "charge");
    chargeRecord.collectionName = "charges";

    const heirarchy = ({root, customerRecord,
            invoiceRecord, partnerRecord, 
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
        partnerRecord, settingsRecord, root} = heirarchy;

    getNewFieldAndAdd(templateApi, settingsRecord)("appName", "string", "");
    
    const newCustomerField = getNewFieldAndAdd(templateApi, customerRecord);


    const partnersReferenceIndex = templateApi.getNewIndexTemplate(root);
    partnersReferenceIndex.name = "partnersReference";
    partnersReferenceIndex.map = "return {name:record.businessName};";
    partnersReferenceIndex.allowedRecordNodeIds = [partnerRecord.recordNodeId];

    const partnerCustomersReverseIndex = templateApi.getNewIndexTemplate(partnerRecord, indexTypes.reference);
    partnerCustomersReverseIndex.name = "partnerCustomers";
    partnerCustomersReverseIndex.map = "return {...record};";
    partnerCustomersReverseIndex.filter = "record.isalive === true"
    partnerCustomersReverseIndex.allowedRecordNodeIds = [customerRecord.recordNodeId];
    heirarchy.partnerCustomersReverseIndex = partnerCustomersReverseIndex;

    newCustomerField("surname", "string");
    newCustomerField("isalive", "bool", "true");
    newCustomerField("createddate", "datetime");
    newCustomerField("age", "number");
    newCustomerField("profilepic", "file");
    const customerPartnerField = newCustomerField("partner", "reference", undefined, {
        indexNodeKey : "/partnersReference",
        displayValue : "name",
        reverseIndexNodeKeys : [joinKey(
            partnerRecord.nodeKey(), "partnerCustomers" )]
    });

    const referredToCustomersReverseIndex = templateApi.getNewIndexTemplate(customerRecord, indexTypes.reference);
    referredToCustomersReverseIndex.name = "referredToCustomers";
    referredToCustomersReverseIndex.map = "return {...record};";
    referredToCustomersReverseIndex.getShardName = "return !record.surname ? 'null' : record.surname.substring(0,1);"   
    referredToCustomersReverseIndex.allowedRecordNodeIds = [customerRecord.recordNodeId];
    heirarchy.referredToCustomersReverseIndex = referredToCustomersReverseIndex;

    const customerReferredByField = newCustomerField("referredBy", "reference", undefined, {
        indexNodeKey : "/customer_index",
        displayValue : "surname",
        reverseIndexNodeKeys : [joinKey(
            customerRecord.nodeKey(), "referredToCustomers")]
    });
    heirarchy.customerReferredByField = customerReferredByField;

    const newInvoiceField = getNewFieldAndAdd(templateApi, invoiceRecord);

    const invoiceTotalIncVatField = newInvoiceField("totalIncVat", "number");
    invoiceTotalIncVatField.typeOptions.decimalPlaces = 2;
    newInvoiceField("createdDate", "datetime");
    newInvoiceField("paidAmount", "number");
    newInvoiceField("invoiceType", "string");
    newInvoiceField("isWrittenOff", "bool");

    const newPartnerField = getNewFieldAndAdd(templateApi, partnerRecord);
    newPartnerField("businessName", "string");

    const newPartnerInvoiceField = getNewFieldAndAdd(templateApi, partnerInvoiceRecord);
    const partnerInvoiceTotalIncVatVield = newPartnerInvoiceField("totalIncVat", "number");
    partnerInvoiceTotalIncVatVield.typeOptions.decimalPlaces = 2;
    newPartnerInvoiceField("createdDate", "datetime");
    newPartnerInvoiceField("paidAmount", "number");

    const newChargeField = getNewFieldAndAdd(templateApi, chargeRecord);
    newChargeField("amount", "number");
    
    const chargePartnerInvoiceField = newChargeField("partnerInvoice", "reference", undefined, {
        reverseIndexNodeKeys : [joinKey(
            partnerInvoiceRecord.nodeKey(), "partnerCharges"
        )],
        displayValue : "createdDate",
        indexNodeKey : joinKey(
            partnerRecord.nodeKey(), "partnerInvoices_index")
    });
    
    const partnerChargesReverseIndex = templateApi.getNewIndexTemplate(partnerInvoiceRecord, indexTypes.reference);
    partnerChargesReverseIndex.name = "partnerCharges";
    partnerChargesReverseIndex.map = "return {...record};";
    partnerChargesReverseIndex.allowedRecordNodeIds = [chargeRecord];
    heirarchy.partnerChargesReverseIndex = partnerChargesReverseIndex;

    const customersReferenceIndex = templateApi.getNewIndexTemplate(heirarchy.root);
    customersReferenceIndex.name = "customersReference";
    customersReferenceIndex.map = "return {name:record.surname}";
    customersReferenceIndex.filter = "record.isalive === true";
    customersReferenceIndex.allowedRecordNodeIds = [customerRecord.recordNodeId];
    
    const invoiceCustomerField = newInvoiceField("customer", "reference", undefined, {
        indexNodeKey : "/customersReference",
        reverseIndexNodeKeys : [findCollectionDefaultIndex(invoiceRecord).nodeKey()],
        displayValue : "name"
    });
}

export const withIndexes = (heirarchy, templateApi) => {
    const {root, customerRecord,
        partnerInvoiceRecord, invoiceRecord, 
        partnerRecord, chargeRecord } = heirarchy;
    const deceasedCustomersIndex = getNewIndexTemplate(root);
    deceasedCustomersIndex.name = "deceased";
    deceasedCustomersIndex.map = "return {surname: record.surname, age:record.age};";
    deceasedCustomersIndex.filter = "record.isalive === false";
    findCollectionDefaultIndex(customerRecord).map = "return record;"
    deceasedCustomersIndex.allowedRecordNodeIds = [customerRecord.recordNodeId];

    findCollectionDefaultIndex(invoiceRecord).allowedRecordNodeIds = [invoiceRecord.recordNodeId];
    findCollectionDefaultIndex(customerRecord).allowedRecordNodeIds = [customerRecord.recordNodeId];
    findCollectionDefaultIndex(partnerRecord).allowedRecordNodeIds = [partnerRecord.recordNodeId];
    findIndex(partnerRecord, "partnerInvoices_index").allowedRecordNodeIds = [partnerInvoiceRecord.recordNodeId];
    findCollectionDefaultIndex(chargeRecord).allowedRecordNodeIds = [chargeRecord.recordNodeId];

    const customerInvoicesIndex = getNewIndexTemplate(root);
    customerInvoicesIndex.name = "customer_invoices";
    customerInvoicesIndex.map = "return record;";
    customerInvoicesIndex.filter = "record.type === 'invoice'";
    customerInvoicesIndex.allowedRecordNodeIds = [invoiceRecord.recordNodeId];

    const outstandingInvoicesIndex = getNewIndexTemplate(root);
    outstandingInvoicesIndex.name = "Outstanding Invoices";
    outstandingInvoicesIndex.filter = "record.type === 'invoice' && record.paidAmount < record.totalIncVat";
    outstandingInvoicesIndex.map = "return {...record};";
    outstandingInvoicesIndex.allowedRecordNodeIds = [
        invoiceRecord.recordNodeId, partnerInvoiceRecord.recordNodeId
    ];

    const allInvoicesAggregateGroup = templateApi.getNewAggregateGroupTemplate(outstandingInvoicesIndex);
    allInvoicesAggregateGroup.name = "all_invoices";

    const allInvoicesByType = templateApi.getNewAggregateGroupTemplate(outstandingInvoicesIndex);
    allInvoicesByType.groupBy = "return record.invoiceType";
    allInvoicesByType.name = "all_invoices_by_type";
    
    const allInvoicesTotalAmountAggregate = templateApi.getNewAggregateTemplate(allInvoicesByType);
    allInvoicesTotalAmountAggregate.name = "totalIncVat";
    allInvoicesTotalAmountAggregate.aggregatedValue = "return record.totalIncVat";

    const allInvoicesPaidAmountAggregate = templateApi.getNewAggregateTemplate(allInvoicesByType);
    allInvoicesPaidAmountAggregate.name = "paidAmount";
    allInvoicesPaidAmountAggregate.aggregatedValue = "return record.paidAmount";

    const writtenOffInvoicesByType = templateApi.getNewAggregateGroupTemplate(outstandingInvoicesIndex);
    writtenOffInvoicesByType.groupBy = "return record.invoiceType";
    writtenOffInvoicesByType.name = "written_off";
    writtenOffInvoicesByType.condition = "record.isWrittenOff === true";

    const writtenOffInvoicesTotalAmountAggregate = templateApi.getNewAggregateTemplate(writtenOffInvoicesByType);
    writtenOffInvoicesTotalAmountAggregate.name = "totalIncVat";
    writtenOffInvoicesTotalAmountAggregate.aggregatedValue = "return record.totalIncVat";

    const customersBySurnameIndex = templateApi.getNewIndexTemplate(root);
    customersBySurnameIndex.name = "customersBySurname";
    customersBySurnameIndex.map = "return {...record};"
    customersBySurnameIndex.filter = "";
    customersBySurnameIndex.allowedRecordNodeIds = [customerRecord.recordNodeId];
    customersBySurnameIndex.getShardName = "return !record.surname ? 'null' : record.surname.substring(0,1);"
    
    const customersDefaultIndex = findCollectionDefaultIndex(customerRecord);
    const customersNoGroupaggregateGroup = templateApi.getNewAggregateGroupTemplate(customersDefaultIndex);
    customersNoGroupaggregateGroup.name = "Customers Summary";
    const allCustomersAgeFunctions = templateApi.getNewAggregateTemplate(customersNoGroupaggregateGroup);
    allCustomersAgeFunctions.aggregatedValue = "return record.age";
    allCustomersAgeFunctions.name = "all customers - age breakdown";
    
    const invoicesByOutstandingIndex = templateApi.getNewIndexTemplate(customerRecord);
    invoicesByOutstandingIndex.name = "invoicesByOutstanding";
    invoicesByOutstandingIndex.map = "return {...record};"
    invoicesByOutstandingIndex.filter = "";
    invoicesByOutstandingIndex.getShardName = "return (record.totalIncVat > record.paidAmount ? 'outstanding' : 'paid');"
    invoicesByOutstandingIndex.allowedRecordNodeIds = [
        partnerInvoiceRecord.recordNodeId, invoiceRecord.recordNodeId
    ];
    const allInvoicesByType_Sharded = templateApi.getNewAggregateGroupTemplate(invoicesByOutstandingIndex);
    allInvoicesByType_Sharded.groupBy = "return record.invoiceType";
    allInvoicesByType_Sharded.name = "all_invoices_by_type";

    const allInvoicesTotalAmountAggregate_Sharded = templateApi.getNewAggregateTemplate(allInvoicesByType_Sharded);
    allInvoicesTotalAmountAggregate_Sharded.name = "totalIncVat";
    allInvoicesTotalAmountAggregate_Sharded.aggregatedValue = "return record.totalIncVat";

    heirarchy.allInvoicesByType = allInvoicesByType;
    heirarchy.allInvoicesTotalAmountAggregate = allInvoicesTotalAmountAggregate;
    heirarchy.allInvoicesPaidAmountAggregate = allInvoicesPaidAmountAggregate;
    heirarchy.customersDefaultIndex = customersDefaultIndex;
    heirarchy.allCustomersAgeFunctions = allCustomersAgeFunctions;
    heirarchy.customersNoGroupaggregateGroup = customersNoGroupaggregateGroup;
    heirarchy.invoicesByOutstandingIndex = invoicesByOutstandingIndex;
    heirarchy.customersBySurnameIndex = customersBySurnameIndex;
    heirarchy.outstandingInvoicesIndex = outstandingInvoicesIndex;
    heirarchy.deceasedCustomersIndex = deceasedCustomersIndex;
    heirarchy.customerInvoicesIndex = customerInvoicesIndex;
};

export const basicAppHeirarchyCreator_WithFields = templateApi => 
    heirarchyFactory(withFields)(templateApi);
    
export const basicAppHeirarchyCreator_WithFields_AndIndexes = templateApi => 
    heirarchyFactory(withFields, withIndexes)(templateApi);

export const setupAppheirarchy = async (creator, disableCleanupTransactions=false) => {
    const {templateApi} = getMemoryTemplateApi();
    const heirarchy = creator(templateApi);
    await initialiseData(templateApi._storeHandle, {heirarchy:heirarchy.root, actions:[], triggers:[]});
    await templateApi.saveApplicationHeirarchy(heirarchy.root);
    const app = await appFromTempalteApi(templateApi, disableCleanupTransactions);
    const collectionApi = getCollectionApi(app);
    const indexApi = getIndexApi(app);
    const authApi = getAuthApi(app);
    const actionsApi = getActionsApi(app);
    const recordApi = await getRecordApi(app);
    recordApi._storeHandle = app.datastore;
    actionsApi._app = app;

    return ({
        recordApi,
        collectionApi,
        templateApi,
        indexApi,
        authApi,
        actionsApi,
        appHeirarchy:heirarchy,
        subscribe:templateApi._eventAggregator.subscribe, 
        app
    });
};

const disableCleanupTransactions = app => {

}

export const getNewFieldAndAdd = (templateApi, record) => (name, type, initial, typeOptions) => {
    const field = templateApi.getNewField(type);
    field.name = name;
    field.getInitialValue = !initial ? "default" : initial;
    if(!!typeOptions) 
        field.typeOptions = typeOptions;
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
    timeCustomerSaveTrigger.condition = "context.record.type === 'customer'";

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

    const {appHeirarchy, templateApi, app, actionsApi} = await setupAppheirarchy(
        basicAppHeirarchyCreator_WithFields
    );

    // adding validation rule so it can fail when we save it 
    templateApi.addRecordValidationRule(appHeirarchy.customerRecord)(
        templateApi.commonRecordValidationRules.fieldNotEmpty("surname")
    );

    await templateApi.saveApplicationHeirarchy(appHeirarchy.root);
    
    const actionsAndTriggers = createValidActionsAndTriggers();
    const {allActions, allTriggers, behaviourSources} = actionsAndTriggers;
    await templateApi.saveActionsAndTriggers(allActions, allTriggers);
    app.actions = initialiseActions(
        templateApi._eventAggregator.subscribe,
        behaviourSources, 
        allActions, 
        allTriggers);
    app.user.permissions = generateFullPermissions(app);
    app.behaviourSources = behaviourSources;
    const appDefinition = await templateApi.getApplicationDefinition();
    return {templateApi, appDefinition, ...actionsAndTriggers, ...appHeirarchy, app, actionsApi};
};


export const validUser = async (app, authApi, password, enabled=true, accessLevels=null) => {
    const access = await authApi.getNewAccessLevel(app);
    access.name = "admin";
    permission.setPassword.add(access);

    const access2 = await authApi.getNewAccessLevel(app);
    access2.name = "admin2";
    permission.setPassword.add(access);
    
    await authApi.saveAccessLevels({version:0, levels:[access, access2]});
    
    const u = authApi.getNewUser(app);
    u.name = "bob";
    if(accessLevels === null)
        u.accessLevels = ["admin"];
    else
        u.accessLevels = accessLevels;

    u.enabled = enabled;
    
    await authApi.createUser(u, password);
    return u;
};