"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = require("winston");
const config_1 = require("../config");
exports.logger = (0, winston_1.createLogger)({
    level: config_1.config.service.nodeEnv === 'production' ? 'info' : 'debug',
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.errors({ stack: true }), config_1.config.service.nodeEnv === 'production'
        ? winston_1.format.json()
        : winston_1.format.combine(winston_1.format.colorize(), winston_1.format.simple())),
    transports: [new winston_1.transports.Console()],
});
//# sourceMappingURL=logger.js.map