"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../logger");
function errorHandler(err, req, res, _next) {
    const statusCode = err.statusCode ?? 500;
    const isProduction = process.env.NODE_ENV === 'production';
    logger_1.logger.error('Request error', {
        method: req.method,
        path: req.path,
        statusCode,
        message: err.message,
        stack: isProduction ? undefined : err.stack,
    });
    res.status(statusCode).json({
        error: statusCode >= 500 ? 'Internal Server Error' : err.message,
        ...(isProduction ? {} : { stack: err.stack }),
    });
}
//# sourceMappingURL=errorHandler.js.map