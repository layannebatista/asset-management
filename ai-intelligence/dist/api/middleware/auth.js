"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireApiKey = requireApiKey;
const config_1 = require("../../config");
/**
 * Simple API key authentication for service-to-service calls.
 * The backend and frontend proxy requests through the Spring Boot API
 * which adds the X-AI-Service-Key header.
 */
function requireApiKey(req, res, next) {
    const key = req.headers['x-ai-service-key'];
    if (!key || key !== config_1.config.service.apiKey) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Valid X-AI-Service-Key header required',
        });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map