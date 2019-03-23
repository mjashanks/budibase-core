import {setupAppheirarchy,
    basicAppHeirarchyCreator_WithFields} from "./specHelpers";
import {keys, filter} from "lodash/fp";
import {$} from "../src/common";
import {permission} from "../src/authApi/permissions";

describe("recordApi > files", () => {
 
    it("upload should fail when files size does not equal stream size", async () => {

    });

    it("upload should fail when record does not exist", async () => {

    });

    it("download should get an uploaded file", async () => {

    });
    
    it("upload should fail when filename contains invalid characters", () => {

    });

    it("upload should fail when path contains '..' ", async () => {

    });
});