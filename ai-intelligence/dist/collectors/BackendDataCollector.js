"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendDataCollector = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const logger_1 = require("../api/logger");
const SensitiveDataMasker_1 = require("../context/SensitiveDataMasker");
/**
 * Pulls structured domain metadata from the Spring Boot backend.
 * Uses internal service-to-service calls (no user JWT needed).
 * All data is masked before storage or LLM dispatch.
 */
class BackendDataCollector {
    baseUrl;
    internalApiKey;
    constructor() {
        this.baseUrl = config_1.config.services.backendUrl;
        this.internalApiKey = config_1.config.service.apiKey;
    }
    async collectDomainRiskData() {
        logger_1.logger.info('Collecting domain risk metadata from backend');
        const [assetStats, transferStats, maintenanceStats, depreciationStats] = await Promise.all([
            this.safeGet('/actuator/ai-intelligence/assets/stats'),
            this.safeGet('/actuator/ai-intelligence/transfers/stats'),
            this.safeGet('/actuator/ai-intelligence/maintenance/stats'),
            this.safeGet('/actuator/ai-intelligence/depreciation/stats'),
        ]);
        const raw = {
            collectedAt: new Date().toISOString(),
            assets: assetStats,
            transfers: transferStats,
            maintenance: maintenanceStats,
            depreciation: depreciationStats,
        };
        return SensitiveDataMasker_1.SensitiveDataMasker.maskObject(raw);
    }
    async collectAuditLogs(limit = 100) {
        logger_1.logger.info('Collecting audit logs for incident analysis');
        const raw = await this.safeGet(`/actuator/ai-intelligence/audit/recent?limit=${limit}`);
        if (!Array.isArray(raw))
            return [];
        return raw.map((entry) => SensitiveDataMasker_1.SensitiveDataMasker.maskObject(entry));
    }
    async collectRecentErrors(limit = 50) {
        const raw = await this.safeGet(`/actuator/ai-intelligence/errors/recent?limit=${limit}`);
        if (!Array.isArray(raw))
            return [];
        return raw.map((entry) => SensitiveDataMasker_1.SensitiveDataMasker.maskObject(entry));
    }
    async safeGet(path) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}${path}`, {
                headers: { 'X-AI-Service-Key': this.internalApiKey },
                timeout: 10000,
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.warn(`Backend data collection failed for ${path}`, { error });
            return null;
        }
    }
}
exports.BackendDataCollector = BackendDataCollector;
//# sourceMappingURL=BackendDataCollector.js.map