export const BadRequestError = (message) => createError(message, 400);

export const UnauthorisedError = (message) => createError(message, 401);

export const ForbiddenError = (message) => createError(message, 403);

export const NotFoundError = (message) => createError(message, 404);

export const ConflictError = (message) => createError(message, 409);

const createError = (message, httpStatusCode) => {
    var err = new Error(message);
    err.HttpStatus = httpStatusCode;
    return err;
}