import {generateSchema} from "../src/indexing/indexSchemaCreator";
import {setupAppheirarchy} from "./specHelpers";

describe("indexSchemGenerator", () => {
    it("should return mapped columns of single type", () => {
        const {recordApi, appHeirarchy} = setup(false);
        const schema = generateSchema(appHeirarchy, appHeirarchy.petsDefaultIndex);
        
    })
});

const setup = includeFish => 
    setupAppheirarchy(createApp(includeFish));

const createApp = (includeFish) => (templateApi) => {
    
    const root = templateApi.getNewRootLevel();
    const pets = templateApi.getNewCollectionTemplate(root);
    pets.name = "pets";

    const dogRecord = templateApi.getNewRecordTemplate(pets);
    dogRecord.name = "dog";

    addField = (recordNode) => (name, type) => {
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

    root.pets = pets;
    root.petsDefaultIndex = pets.indexes[0];
    root.dogRecord = dogRecord;
    return root;         

};
