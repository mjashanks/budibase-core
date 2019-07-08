export const badRequestError = (message) => createError(message, 400);

export const unauthorisedError = (message) => createError(message, 401);

export const forbiddenError = (message) => createError(message, 403);

export const notFoundError = (message) => createError(message, 404);

export const conflictError = (message) => createError(message, 409);

const createError = (message, httpStatusCode) => {
    var err = new Error(message);
    err.HttpStatus = httpStatusCode;
    return err;
}