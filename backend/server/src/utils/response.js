const HTTP_STATUS = require('./httpStatus');

/**
 * Success Response Handler
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {number} options.statusCode - HTTP status code (default: 200)
 * @param {string} options.message - Response message
 * @param {*} options.data - Response data
 * @param {Object} options.meta - Pagination or additional metadata
 */
const successResponse = (
  res,
  { statusCode = HTTP_STATUS.OK, message = 'Success', data = null, meta = null }
) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error Response Handler
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {number} options.statusCode - HTTP status code (default: 500)
 * @param {string} options.message - Error message
 * @param {*} options.errors - Validation or detailed errors
 * @param {string} options.stack - Error stack trace (only in development)
 */
const errorResponse = (
  res,
  {
    statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message = 'Internal Server Error',
    errors = null,
    stack = null,
  }
) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Stack trace শুধু development এ দেখাবে
  if (process.env.NODE_ENV === 'development' && stack) {
    response.stack = stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * Pagination Meta Generator
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 */
const paginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Created Response (201)
 */
const createdResponse = (res, { message = 'Created successfully', data = null }) => {
  return successResponse(res, {
    statusCode: HTTP_STATUS.CREATED,
    message,
    data,
  });
};

/**
 * No Content Response (204)
 */
const noContentResponse = (res) => {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
};

/**
 * Bad Request Response (400)
 */
const badRequestResponse = (res, { message = 'Bad request', errors = null }) => {
  return errorResponse(res, {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message,
    errors,
  });
};

/**
 * Unauthorized Response (401)
 */
const unauthorizedResponse = (res, { message = 'Unauthorized' } = {}) => {
  return errorResponse(res, {
    statusCode: HTTP_STATUS.UNAUTHORIZED,
    message,
  });
};

/**
 * Forbidden Response (403)
 */
const forbiddenResponse = (res, { message = 'Forbidden' } = {}) => {
  return errorResponse(res, {
    statusCode: HTTP_STATUS.FORBIDDEN,
    message,
  });
};

/**
 * Not Found Response (404)
 */
const notFoundResponse = (res, { message = 'Resource not found' } = {}) => {
  return errorResponse(res, {
    statusCode: HTTP_STATUS.NOT_FOUND,
    message,
  });
};

/**
 * Conflict Response (409)
 */
const conflictResponse = (res, { message = 'Conflict', errors = null }) => {
  return errorResponse(res, {
    statusCode: HTTP_STATUS.CONFLICT,
    message,
    errors,
  });
};

/**
 * Validation Error Response (422)
 */
const validationErrorResponse = (res, { message = 'Validation failed', errors }) => {
  return errorResponse(res, {
    statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    message,
    errors,
  });
};

module.exports = {
  successResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  validationErrorResponse,
  paginationMeta,
};
