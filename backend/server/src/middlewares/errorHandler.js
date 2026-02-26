const ApiError = require('../utils/ApiError');
const HTTP_STATUS = require('../utils/httpStatus');
const { errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Prisma Error Handler
 * Handles common Prisma errors and converts them to ApiError
 */
const handlePrismaError = (error) => {
    // P2002: Unique constraint violation
    if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        return ApiError.conflict(`${field} already exists`);
    }

    // P2025: Record not found
    if (error.code === 'P2025') {
        return ApiError.notFound('Record not found');
    }

    // P2003: Foreign key constraint violation
    if (error.code === 'P2003') {
        return ApiError.badRequest('Foreign key constraint failed');
    }

    // P2014: Relation violation
    if (error.code === 'P2014') {
        return ApiError.badRequest('Required relation is missing');
    }

    return ApiError.internal('Database error occurred');
};

/**
 * JWT Error Handler
 */
const handleJWTError = (error) => {
    if (error.name === 'JsonWebTokenError') {
        return ApiError.unauthorized('Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
        return ApiError.unauthorized('Token expired');
    }
    return error;
};

/**
 * Validation Error Handler (for express-validator)
 */
const handleValidationError = (error) => {
    if (error.array && typeof error.array === 'function') {
        const errors = error.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value,
        }));
        return ApiError.validationError('Validation failed', errors);
    }
    return error;
};

/**
 * Mongoose Error Handler (if using Mongoose)
 */
const handleMongooseError = (error) => {
    // Validation Error
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
            field: err.path,
            message: err.message,
        }));
        return ApiError.validationError('Validation failed', errors);
    }

    // Duplicate Key Error
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return ApiError.conflict(`${field} already exists`);
    }

    // Cast Error
    if (error.name === 'CastError') {
        return ApiError.badRequest(`Invalid ${error.path}: ${error.value}`);
    }

    return error;
};

/**
 * Development Error Response
 * Shows full error details including stack trace
 */
const sendErrorDev = (err, res) => {
    return errorResponse(res, {
        statusCode: err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: err.message,
        errors: err.errors,
        stack: err.stack,
        error: err,
    });
};

/**
 * Production Error Response
 * Only shows necessary error information
 */
const sendErrorProd = (err, res) => {
    // Operational errors (known/trusted errors)
    if (err.isOperational) {
        return errorResponse(res, {
            statusCode: err.statusCode,
            message: err.message,
            errors: err.errors,
        });
    }

    // Programming or unknown errors
    logger.error(`💥 ERROR: ${err.message}\n${err.stack || JSON.stringify(err)}`);

    return errorResponse(res, {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: 'Something went wrong',
    });
};

/**
 * Global Error Handler Middleware
 * Must be used after all routes
 *
 * Usage in app.js:
 * app.use(globalErrorHandler);
 */
const globalErrorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;

    // Set default values
    error.statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    error.isOperational = error.isOperational || false;

    // Handle specific error types
    if (err.name === 'PrismaClientKnownRequestError') {
        error = handlePrismaError(err);
    }

    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        error = handleJWTError(err);
    }

    if (err.name === 'ValidationError' || err.name === 'CastError') {
        error = handleMongooseError(err);
    }

    // Send error response
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, res);
    } else {
        sendErrorProd(error, res);
    }
};

/**
 * Unhandled Rejection Handler
 * Add this in your server.js/app.js
 */
const unhandledRejectionHandler = () => {
    process.on('unhandledRejection', (reason, promise) => {
        logger.error('💥 UNHANDLED REJECTION! Shutting down...');
        logger.error(`Reason: ${reason}\nPromise: ${promise}`);
        process.exit(1);
    });
};

/**
 * Uncaught Exception Handler
 */
const uncaughtExceptionHandler = () => {
    process.on('uncaughtException', (error) => {
        logger.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
        logger.error(`${error.name}: ${error.message}\n${error.stack}`);
        process.exit(1);
    });
};

module.exports = {
    globalErrorHandler,
    unhandledRejectionHandler,
    uncaughtExceptionHandler,
};