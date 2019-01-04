import {generateSchema} from "../src/indexing/indexSchemaCreator";
import {setupAppheirarchy} from "./specHelpers";
import {find} from "lodash";

describe("indexSchemGenerator", () => {
    it("should return mapped columns of single type", async () => {
        const {appHeirarchy} = await setup(false);
        const schema = generateSchema(appHeirarchy, appHeirarchy.petsDefaultIndex);
        schemaHasFieldOfType(schema, "key", "string");
        schemaHasFieldOfType(schema, "sortKey", "string");
        schemaHasFieldOfType(schema, "name", "string");
        schemaHasFieldOfType(schema, "dob", "datetime");
        schemaHasFieldOfType(schema, "isAlive", "bool");
    })
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
    };

    const addDogField = addField(dogRecord);      
    addDogField("name", "string");
    addDogField("dob", "datetime");
    addDogField("isAlive", "bool");

    if(includeFish) {
        const fishRecord = templateApi.getNewRecordTemplate(pets);
        const addFishField = addField(fishRecord);
        fishRecord.name = "lizard";
        addFishField("name", "string");
        addFishField("isAlive", "bool");
        addFishField("noOfGills", "number");
        root.fishRecord = fishRecord;
    }

    return ({
        pets, petsDefaultIndex: pets.indexes[0],
        dogRecord, root
    })
};
