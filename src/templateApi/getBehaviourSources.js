
export const getBehaviourSources = async datastore => {
    try {
        await datastore.loadFile("/.config/behaviourSources.js");
    } catch(e) {
        return;
    }
}
