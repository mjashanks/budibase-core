import azBlobStore from "./datastores/azure-blob-storage";
import memory from "../src/datastores/memory";
import {setupDatastore} from "../src/datastores";
import {defaultStoreHandlers, getDataStore} from "../src/datastores";
import {setupApp} from "./azurePocSetup";

let setup = null;
let recordApi = null;

describe("azure Poc", () => {

    const before = async () => {

        /*
        const azBlobstore =  getDataStore(
            defaultStoreHandlers,
            "memory", {
            account: "hello",
            accountKey: "the key",
            containerName: "budibase_azurepoc"});
        });
        */

        const memoryStore = setupDatastore(memory({})); 

        setup = await setupApp(
            memoryStore
        );

        recordApi = setup.apis.recordApi;

    };

    it("create record", async () => {
        await before();

        const client = setup.getClient();
        await recordApi.save(client);

    });
    
});



