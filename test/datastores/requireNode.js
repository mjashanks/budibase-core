import electron from "electron";
const native = electron.remote.require("./nativeModules"); 

export default (mod) => {
    return native[mod]; 
}
