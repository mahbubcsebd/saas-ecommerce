const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    const fieldNames = [...new Set(formattedErrors.map((e) => e.field))].join(', ');
    const firstErrorMessage = formattedErrors[0].message;
    const summaryMessage = firstErrorMessage;

    return next(ApiError.validationError(summaryMessage, formattedErrors));
  }

  next();
};

module.exports = validate;
