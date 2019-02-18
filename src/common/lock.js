
const lockOverlapMilliseconds = 10;

export const getLock = async (app, lockFile, timeoutMilliseconds, maxLockRetries, retryCount=0) => {
    try {
        const timeout = 
            (await app.getEpochTime()
            +
            timeoutMilliseconds);

        const lock = {
            timeout,
            key:lockFile,
            totalTimeout:timeoutMilliseconds
        };
        
        await app.datastore.createFile(
            lockFile, 
            getLockFileContent(
                lock.totalTimeout, 
                lock.timeout)
        );

        return lock;
    } catch(e) {

        const lock = parseLockFileContent(
            await app.datastore.loadFile(lockFile)
        );

        const currentEpochTime = await app.getEpochTime();
  
        if(currentEpochTime > lock.timeout) {
            try {
                await app.datastore.deleteFile(lockFile);
            }
            catch(_) {};
        } 

        if(retryCount < maxLockRetries ) {
            await sleepForRetry();
            return await getLock(app, retryCount+1);
        }
    }

    return NO_LOCK;
};

const getLockFileContent = (totalTimeout, epochTime) => 
    `${totalTimeout}:${epochTime.toString()}`;

const parseLockFileContent = (key, content) =>  
    $(content, [
        split(":"),
        parts => ({
            totalTimeout:new Number(parts[0]), 
            timeout:new Number(parts[1]),
            key
        })
    ]);

export const releaseLock = async (app,lock) => {

    const currentEpochTime = await app.getEpochTime();
    // only release if not timedout
    if(currentEpochTime < (lock.timeout - lockOverlapMilliseconds)) {
        try {
            await app.datastore.deleteFile(lock.key);
        }
        catch(_) {};
    } 
}

export const extendLock = async (app, lock) => {
    const currentEpochTime = await app.getEpochTime();
    // only release if not timedout
    if(currentEpochTime < (lock.timeout - lockOverlapMilliseconds)) {
        try {
            lock.timeout = currentEpochTime + timeoutMilliseconds;
            await app.datastore.updateFile(
                lock.key, 
                getLockFileContent(lock.totalTimeout, timeout)
            );
            return lock;
        }
        catch(_) {};
    } 
    return NO_LOCK;
}

export const NO_LOCK = "no lock";
export const isNolock = id => id === NO_LOCK;

const sleepForRetry = () =>
    new Promise(resolve => setTimeout(resolve, lockOverlapMilliseconds));