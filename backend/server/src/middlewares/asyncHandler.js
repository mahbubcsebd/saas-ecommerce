/**
 * Method 1: Simple wrapper
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Method 2: With explicit error handling
 */
const asyncHandler2 = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Method 3: Class-based (for controllers)
 */
class AsyncHandler {
    static wrap(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    static wrapClass(controllerClass) {
        const wrapped = {};
        const methods = Object.getOwnPropertyNames(
            Object.getPrototypeOf(controllerClass)
        );

        methods.forEach((method) => {
            if (method !== 'constructor' && typeof controllerClass[method] === 'function') {
                wrapped[method] = this.wrap(controllerClass[method].bind(controllerClass));
            }
        });

        return wrapped;
    }
}

module.exports = asyncHandler;
// module.exports = { asyncHandler, asyncHandler2, AsyncHandler };