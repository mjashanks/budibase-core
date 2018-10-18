import getAppApis from "../src";
import getTemplateApi from "../src/templateApi";

const addField = templateApi => type => (record, name) => {
    const field = templateApi.getNewField(type);
    field.name = name;
    field.type = type;
    field.label = name;
    templateApi.addField(
        record,
        field);
}

export const setupApp = async (datastore) => {


    const templateApi = getTemplateApi(datastore);
    const addStringField = addField(templateApi)("string");
    const addDateField = addField(templateApi)("datetime");
    const addBoolField = addField(templateApi)("bool");

    const root = templateApi.getNewRootLevel();

    const clients = templateApi.getNewCollectionTemplate(root);
    clients.name = "clients";
    
    const client = templateApi.getNewRecordTemplate(clients);
    client.name = "client"
    addStringField(client, "FamilyName");
    addStringField(client, "Address1");
    addStringField(client, "Address2");
    addStringField(client, "Address3");
    addStringField(client, "Address4");
    addStringField(client, "Postcode");
    addDateField(client, "CreatedDate");

    const children = templateApi.getNewCollectionTemplate(client);
    children.name = "children";
    
    const child = templateApi.getNewRecordTemplate(children);
    child.name = "child";
    addStringField(child, "FirstName");
    addStringField(child, "Surname");
    addDateField(child, "DateOfBirth");
    addBoolField(child, "Current");

    const contacts = templateApi.getNewCollectionTemplate(client);
    contacts.name = "contacts";
    
    const contact = templateApi.getNewRecordTemplate(contacts);
    contact.name = "contact";
    addStringField(contact, "Name");
    addStringField(contact, "relationship");
    addStringField(contact, "phone1");
    addStringField(contact, "phone2");
    addBoolField(contact, "active");

    await templateApi.saveApplicationHeirarchy(root);

    const apis = await getAppApis(datastore);

    await apis.collectionApi.initialiseAll();

    return ({
        apis,
        getClient: getClient(apis)
    });
    
     /* parking this for now
    const staff = templateApi.getNewCollectionTemplate(root);
    staff.name = "staff";
    
    const carer = templateApi.getNewRecordTemplate(staff);
    carer.name = "carer";
    addStringField(carer, "Name");
    addStringField(carer, telephone);
    const attendance = templateApi.getNewCollectionTemplate(root);
    */

}

const getClient = (apis) => () => {
    const client = apis.recordApi.getNew("/clients", "client");
    client.FamilyName = "Humperdink";
    client.Address1 = "97 Mainitucetts Avenue";
    client.Address2 = "Longerton Road South";
    client.Address3 = "Chalico City";
    client.Address4 = "Northern Afganistan";
    client.Postcode = "BY71 5FR";
    client.CreatedDate = new Date();
    return client;
}




