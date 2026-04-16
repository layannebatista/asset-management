"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../config");
const logger_1 = require("./logger");
const auth_1 = require("./middleware/auth");
const errorHandler_1 = require("./middleware/errorHandler");
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const analysis_routes_1 = require("./routes/analysis.routes");
const AnalysisRepository_1 = require("../storage/AnalysisRepository");
const AIOrchestrator_1 = require("../orchestrator/AIOrchestrator");
const AgentCoordinator_1 = require("../agents/AgentCoordinator");
const LLMClient_1 = require("../llm/LLMClient");
const PrometheusCollector_1 = require("../collectors/PrometheusCollector");
const AllureCollector_1 = require("../collectors/AllureCollector");
const GitHubActionsCollector_1 = require("../collectors/GitHubActionsCollector");
const BackendDataCollector_1 = require("../collectors/BackendDataCollector");
async function bootstrap() {
    // ─── Infrastructure ────────────────────────────────────────────────────────
    const repository = new AnalysisRepository_1.AnalysisRepository();
    await repository.initialize();
    // ─── Shared dependencies ───────────────────────────────────────────────────
    const llm = new LLMClient_1.LLMClient();
    const prometheus = new PrometheusCollector_1.PrometheusCollector();
    const allure = new AllureCollector_1.AllureCollector();
    const github = new GitHubActionsCollector_1.GitHubActionsCollector();
    const backend = new BackendDataCollector_1.BackendDataCollector();
    // ─── Application layer ─────────────────────────────────────────────────────
    const orchestrator = new AIOrchestrator_1.AIOrchestrator(repository);
    const agentCoordinator = new AgentCoordinator_1.AgentCoordinator(llm, repository, prometheus, allure, github, backend);
    // ─── Express app ───────────────────────────────────────────────────────────
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({ origin: config_1.config.service.nodeEnv === 'development' ? '*' : false }));
    app.use(express_1.default.json({ limit: '2mb' }));
    // Health endpoints (no auth)
    app.use('/', health_routes_1.default);
    // Rate limiting for AI endpoints
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: config_1.config.rateLimit.windowMs,
        max: config_1.config.rateLimit.maxRequests,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many requests, please slow down.' },
    });
    // Protected AI analysis routes
    app.use('/api/v1/analysis', limiter, auth_1.requireApiKey, (0, analysis_routes_1.createAnalysisRouter)(orchestrator, agentCoordinator));
    // Global error handler
    app.use(errorHandler_1.errorHandler);
    // ─── Start ──────────────────────────────────────────────────────────────────
    const server = app.listen(config_1.config.service.port, () => {
        logger_1.logger.info(`AI Intelligence Service started`, {
            port: config_1.config.service.port,
            env: config_1.config.service.nodeEnv,
            model: config_1.config.openai.model,
        });
    });
    // Graceful shutdown
    const shutdown = async (signal) => {
        logger_1.logger.info(`${signal} received – shutting down gracefully`);
        server.close(async () => {
            await repository.close();
            logger_1.logger.info('Server closed');
            process.exit(0);
        });
        setTimeout(() => process.exit(1), 10_000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
bootstrap().catch((error) => {
    console.error('Failed to start AI Intelligence Service:', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map