"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnalysisRouter = createAnalysisRouter;
const express_1 = require("express");
const zod_1 = require("zod");
const logger_1 = require("../logger");
// ─── Request schemas ──────────────────────────────────────────────────────────
const ObservabilitySchema = zod_1.z.object({
    windowMinutes: zod_1.z.number().int().min(5).max(1440).optional(),
});
const TestIntelligenceSchema = zod_1.z.object({
    projectId: zod_1.z.string().optional(),
    suite: zod_1.z.enum(['backend', 'frontend', 'all']).optional(),
});
const CICDSchema = zod_1.z.object({
    workflowFile: zod_1.z.string().optional(),
    lookbackDays: zod_1.z.number().int().min(1).max(30).optional(),
});
const IncidentSchema = zod_1.z.object({
    logs: zod_1.z.array(zod_1.z.string()).min(1).max(200),
    errorMessages: zod_1.z.array(zod_1.z.string()).max(50).optional(),
    timeWindowMinutes: zod_1.z.number().int().min(1).max(1440).optional(),
});
const RiskSchema = zod_1.z.object({
    domains: zod_1.z
        .array(zod_1.z.enum(['asset', 'transfer', 'maintenance', 'depreciation', 'insurance', 'inventory']))
        .optional(),
    assetIds: zod_1.z.array(zod_1.z.string().uuid()).max(10).optional(),
});
function getSingleQueryParam(value) {
    return typeof value === 'string' ? value : undefined;
}
// ─── Route factory ────────────────────────────────────────────────────────────
function createAnalysisRouter(orchestrator, agentCoordinator) {
    const router = (0, express_1.Router)();
    // POST /api/v1/analysis/observability
    router.post('/observability', async (req, res, next) => {
        try {
            const body = ObservabilitySchema.parse(req.body);
            logger_1.logger.info('POST /analysis/observability', body);
            const result = await orchestrator.analyze({ type: 'observability', ...body });
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    });
    // POST /api/v1/analysis/test-intelligence
    router.post('/test-intelligence', async (req, res, next) => {
        try {
            const body = TestIntelligenceSchema.parse(req.body);
            const result = await orchestrator.analyze({ type: 'test-intelligence', ...body });
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    });
    // POST /api/v1/analysis/cicd
    router.post('/cicd', async (req, res, next) => {
        try {
            const body = CICDSchema.parse(req.body);
            const result = await orchestrator.analyze({ type: 'cicd', ...body });
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    });
    // POST /api/v1/analysis/incident
    router.post('/incident', async (req, res, next) => {
        try {
            const body = IncidentSchema.parse(req.body);
            const result = await orchestrator.analyze({ type: 'incident', ...body });
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    });
    // POST /api/v1/analysis/risk
    router.post('/risk', async (req, res, next) => {
        try {
            const body = RiskSchema.parse(req.body);
            const result = await orchestrator.analyze({ type: 'risk', ...body });
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    });
    // POST /api/v1/analysis/multi-agent
    router.post('/multi-agent', async (_req, res, next) => {
        try {
            const result = await agentCoordinator.runAll();
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    });
    // GET /api/v1/analysis/history?type=observability&limit=10
    router.get('/history', async (req, res, next) => {
        try {
            const typeParam = getSingleQueryParam(req.query['type']);
            const type = typeParam;
            const limitParam = getSingleQueryParam(req.query['limit']);
            const limit = Math.min(parseInt(limitParam ?? '20', 10), 100);
            const results = await orchestrator.getHistory(type, limit);
            res.json({ data: results, total: results.length });
        }
        catch (error) {
            next(error);
        }
    });
    // GET /api/v1/analysis/:id
    router.get('/:id', async (req, res, next) => {
        try {
            const id = getSingleQueryParam(req.params['id']);
            if (!id) {
                res.status(400).json({ error: 'Analysis id is required' });
                return;
            }
            const result = await orchestrator.getById(id);
            if (!result) {
                res.status(404).json({ error: 'Analysis not found' });
                return;
            }
            res.json(result);
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
//# sourceMappingURL=analysis.routes.js.map