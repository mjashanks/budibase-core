import {getMemoryTemplateApi} from "./specHelpers";

const getMemoryStore = () => getMemoryTemplateApi({});

describe.skip("ensureDefaults", () => {
    
    const ensureDefaults = getMemoryStore().ensureDefaults;

    it("should add field, with default value, when does note exist", () => {

        const defaultFields = {
            title : {
                defaultValue : () => "the title"
            }
        };

        const notes = {};
        ensureDefaults(notes, defaultFields);
        expect(notes.title).toBe("the title");
    });

    it("should do nothing if no default fields supplied", () => {

        const defaultFields = {};
        const notes = {};
        ensureDefaults(notes, defaultFields);
        ensureDefaults(notes);
    });
});