const ApiError = require('../utils/ApiError');
const HTTP_STATUS = require('../utils/httpStatus');

const notFound = (req, res, next) => {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

const notFoundDirect = (req, res) => {
  return res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { notFound, notFoundDirect };
