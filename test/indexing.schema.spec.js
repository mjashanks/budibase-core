import {generateSchema} from "../src/indexing/indexSchemaCreator";
import {setupAppheirarchy} from "./specHelpers";
import {find} from "lodash";

describe("indexSchemGenerator", () => {

    it("should return mapped columns of single type, when accepts all in collection of one type", async () => {
        const {appHeirarchy} = await setup(false);
        const schema = generateSchema(appHeirarchy.root, appHeirarchy.petsDefaultIndex);
        schemaHasFieldOfType(schema, "key", "string");
        schemaHasFieldOfType(schema, "sortKey", "string");
        schemaHasFieldOfType(schema, "name", "string");
        schemaHasFieldOfType(schema, "dob", "datetime");
        schemaHasFieldOfType(schema, "isAlive", "bool");
        expect(schema.length).toBe(5);
    });

    it("should return mapped columns of two types, when accepts all in collection or two typs", async () => {
        const {appHeirarchy} = await setup(true);
        const schema = generateSchema(appHeirarchy.root, appHeirarchy.petsDefaultIndex);
        schemaHasFieldOfType(schema, "key", "string");
        schemaHasFieldOfType(schema, "sortKey", "string");
        schemaHasFieldOfType(schema, "name", "string");
        schemaHasFieldOfType(schema, "dob", "datetime");
        schemaHasFieldOfType(schema, "isAlive", "bool");
        schemaHasFieldOfType(schema, "noOfGills", "number");
        expect(schema.length).toBe(7);
    });

    it("should return mapped columns of one types, when accepts only onw of two types", async () => {
        const {appHeirarchy} = await setup(true);
        const schema = generateSchema(appHeirarchy.root, appHeirarchy.fishOnlyIndex);
        schemaHasFieldOfType(schema, "key", "string");
        schemaHasFieldOfType(schema, "sortKey", "string");
        schemaHasFieldOfType(schema, "name", "string");
        schemaHasFieldOfType(schema, "isAlive", "bool");
        schemaHasFieldOfType(schema, "noOfGills", "number");
        expect(schema.length).toBe(5);
    });

    it("should return mapped columns type, for reverse reference index", async () => {
        const {appHeirarchy} = await setup(true);
        const schema = generateSchema(appHeirarchy.root, appHeirarchy.dogFriends);
        schemaHasFieldOfType(schema, "key", "string");
        schemaHasFieldOfType(schema, "sortKey", "string");
        schemaHasFieldOfType(schema, "name", "string");
        schemaHasFieldOfType(schema, "isAlive", "bool");
        schemaHasFieldOfType(schema, "dob", "datetime");
        schemaHasFieldOfType(schema, "favouriteFish", "reference");
        expect(schema.length).toBe(6);
    });

});

const schemaHasFieldOfType = (schema, fieldname, type) => {
    const field = find(schema, f => f.name === fieldname);
    const fname = !field ? "field not found" : field.name;
    expect(fname).toBe(fieldname);
    expect(field.type).toBe(type);
}

const setup = includeFish => 
    setupAppheirarchy(createApp(includeFish));

const createApp = (includeFish) => (templateApi) => {
    
    const root = templateApi.getNewRootLevel();
    const pets = templateApi.getNewCollectionTemplate(root);
    pets.name = "pets";

    const dogRecord = templateApi.getNewRecordTemplate(pets);
    dogRecord.name = "dog";

    const addField = (recordNode) => (name, type) => {
        const field = templateApi.getNewField(type);
        field.name = name;
        templateApi.addField(recordNode, field);
        return field;
    };

    const addDogField = addField(dogRecord);      
    addDogField("name", "string");
    addDogField("dob", "datetime");
    addDogField("isAlive", "bool");

    let fishStuff = {};
    if(includeFish) {
        const fishRecord = templateApi.getNewRecordTemplate(pets);
        const addFishField = addField(fishRecord);
        fishRecord.name = "lizard";
        addFishField("name", "string");
        addFishField("isAlive", "bool");
        addFishField("noOfGills", "number");
        fishStuff.fishRecord = fishRecord;
        const fishOnlyIndex = templateApi.getNewIndexTemplate(pets);
        fishOnlyIndex.name = "fishOnly";
        fishOnlyIndex.allowedRecordNodeIds = [fishRecord.recordNodeId];
        fishStuff.fishOnlyIndex = fishOnlyIndex;

        const dogFriends = templateApi.getNewIndexTemplate(dogRecord);
        dogFriends.name = "dogFriends";
        fishStuff.dogFriends = dogFriends;

        const favFishField = addDogField("favouriteFish", "reference");
        favFishField.typeOptions.indexNodeKey = fishOnlyIndex.nodeKey();
        favFishField.typeOptions.reverseIndexNodeKey = dogFriends.nodeKey();
    }

    return ({
        pets, petsDefaultIndex: pets.indexes[0],
        dogRecord, root, ...fishStuff
    })
};
