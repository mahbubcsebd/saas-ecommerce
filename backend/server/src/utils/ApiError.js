const HTTP_STATUS = require('./httpStatus');

/**
 * Custom API Error Class
 * Extends built-in Error class for operational errors
 */
class ApiError extends Error {
    /**
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Error message
     * @param {Array|Object|null} errors - Validation or detailed errors
     * @param {boolean} isOperational - Is this an operational error?
     * @param {string} stack - Stack trace
     */
    constructor(
        statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message = 'Internal Server Error',
        errors = null,
        isOperational = true,
        stack = ''
    ) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.isOperational = isOperational;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    // Static factory methods for common errors
    static badRequest(message = 'Bad Request', errors = null) {
        return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors);
    }

    static unauthorized(message = 'Unauthorized') {
        return new ApiError(HTTP_STATUS.UNAUTHORIZED, message);
    }

    static forbidden(message = 'Forbidden') {
        return new ApiError(HTTP_STATUS.FORBIDDEN, message);
    }

    static notFound(message = 'Resource not found') {
        return new ApiError(HTTP_STATUS.NOT_FOUND, message);
    }

    static conflict(message = 'Conflict', errors = null) {
        return new ApiError(HTTP_STATUS.CONFLICT, message, errors);
    }

    static validationError(message = 'Validation failed', errors) {
        return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, errors);
    }

    static internal(message = 'Internal Server Error') {
        return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message);
    }
}

module.exports = ApiError;