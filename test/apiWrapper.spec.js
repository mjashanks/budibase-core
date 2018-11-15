import {apiWrapper} from "../src/common/apiWrapper";
import {filter} from "lodash/fp";
import {event, onComplete, 
        onBegin, onError, events} from "../src/common";

const getApp = () => {

    var events = [];

    return {
        publish: (name, context) => 
            events.push({name, context}),
        events,
        getEvents: n => filter(e => e.name === n)
                              (events)
    };
};

describe("apiWrapper", () => {

    const testNamespace = {
        onBegin:"testArea:testMethod:onBegin",
        onComplete:"testArea:testMethod:onComplete",
        onError:"testArea:testMethod:onError",
    }

    const getCompleteEvents = app => 
    app.getEvents(testNamespace.onComplete);

    const getBeginEvents = app => 
        app.getEvents(testNamespace.onBegin);

    const getErrorEvents = app => 
        app.getEvents(testNamespace.onError);

    const runThrowEx = (arg1, arg2) => {
        const throwEx = (x,y) => {throw new Error("test error");}
        const app = getApp();
        try {
            apiWrapper(
                app,
                testNamespace, {prop:"hello"}, 
                throwEx, arg1, arg2
            );
        } catch(error) {
            return {app, error};
        }
        return {app, error:"error was not thrown"};
    }

    const runThrowExAsync = async (arg1, arg2) => {
        const throwEx = async (x,y) => {throw new Error("test error");}
        const app = getApp();
        try {
            await apiWrapper(
                app,
                testNamespace, {prop:"hello"}, 
                throwEx, arg1, arg2
            );
        } catch(error) {
            return {app, error};
        }
        return {app, error:"error was not thrown"};
    }

    const runAdd = (arg1, arg2) => {
        const add = (x,y) => x+y;
        const app =getApp();
        const result = apiWrapper(
            app,
            testNamespace, {prop:"hello"}, 
            add, arg1, arg2
        );
        return {app, result};
    }

    const runAddAsync = async (arg1, arg2) => {
        const add = async (x,y) => x+y;
        const app =getApp();
        const result = await apiWrapper(
            app,
            testNamespace, {prop:"hello"}, 
            add, arg1, arg2
        );
        return {app, result};
    }

    it("should return result of inner function", () => {
        expect(runAdd(1,2).result).toBe(3);
    });

    it("should return result of inner function when async", async () => {
        expect(
            (await runAddAsync(1,2)).result).toBe(3);
    });

    it("should publish begin and complete events", () => {
        const {app} = runAdd(1,2);
        const onCompleteEvents = getCompleteEvents(app);
        const onBeginEvents = getBeginEvents(app);
        expect(onCompleteEvents.length).toBe(1);
        expect(onCompleteEvents[0].context.prop).toBe("hello");
        expect(onBeginEvents.length).toBe(1);
        expect(onBeginEvents[0].context.prop).toBe("hello");
    });

    it("should throw exception when inner function happens", () => {
        const {error} = runThrowEx(1,2);
        expect(error).toBeDefined();
        expect(error.message).toBe("test error");
    });

    it("should publish error event when inner exception", () => {
        const {app} = runThrowEx(1,2);
        const errorEvents = getErrorEvents(app);
        expect(errorEvents.length).toBe(1);
        expect(errorEvents[0].context.error.message).toBe("test error");
    });

    it("should throw exception when inner function happens, on async", async () => {
        const {error} = await runThrowExAsync(1,2);
        expect(error).toBeDefined();
        expect(error.message).toBe("test error");
    });

    it("should publish error event when inner exception, on async", async () => {
        const {app} = await runThrowExAsync(1,2);
        const errorEvents = getErrorEvents(app);
        expect(errorEvents.length).toBe(1);
        expect(errorEvents[0].context.error.message).toBe("test error");
    });

});

describe("events", () => {
    it("should return contain various spot checked events", () => {
        expect(events.recordApi.save.onComplete)
        .toBe("recordApi:save:onComplete");
        expect(events.viewApi.buildIndex.onBegin)
        .toBe("viewApi:buildIndex:onBegin");
        expect(events.collectionApi.initialise.onError)
        .toBe("collectionApi:initialise:onError");
    });
})