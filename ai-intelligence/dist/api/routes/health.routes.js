"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    res.json({
        status: 'UP',
        service: 'ai-intelligence',
        timestamp: new Date().toISOString(),
    });
});
router.get('/health/ready', async (_req, res) => {
    // Could add DB connectivity check here
    res.json({ ready: true });
});
exports.default = router;
//# sourceMappingURL=health.routes.js.map