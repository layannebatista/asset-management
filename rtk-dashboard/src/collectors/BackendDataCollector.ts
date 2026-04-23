import axios from 'axios';
import { config } from '../config';
import { logger } from '../api/logger';
import { SensitiveDataMasker } from '../context/SensitiveDataMasker';

/**
 * Pulls structured domain metadata from the Spring Boot backend.
 * Uses internal service-to-service calls (no user JWT needed).
 * All data is masked before storage or LLM dispatch.
 */
export class BackendDataCollector {
  private readonly baseUrl: string;
  private readonly internalApiKey: string;

  constructor() {
    this.baseUrl = config.services.backendUrl;
    this.internalApiKey = config.service.apiKey;
  }

  async collectDomainRiskData(): Promise<Record<string, unknown>> {
    logger.info('Collecting domain risk metadata from backend');

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

    return SensitiveDataMasker.maskObject(raw);
  }

  async collectAuditLogs(limit = 100): Promise<Record<string, unknown>[]> {
    logger.info('Collecting audit logs for incident analysis');

    const raw = await this.safeGet(`/actuator/ai-intelligence/audit/recent?limit=${limit}`);
    if (!Array.isArray(raw)) return [];

    return (raw as Record<string, unknown>[]).map((entry) =>
      SensitiveDataMasker.maskObject(entry),
    );
  }

  async collectRecentErrors(limit = 50): Promise<Record<string, unknown>[]> {
    const raw = await this.safeGet(`/actuator/ai-intelligence/errors/recent?limit=${limit}`);
    if (!Array.isArray(raw)) return [];

    return (raw as Record<string, unknown>[]).map((entry) =>
      SensitiveDataMasker.maskObject(entry),
    );
  }

  private async safeGet(path: string): Promise<unknown> {
    try {
      const response = await axios.get(`${this.baseUrl}${path}`, {
        headers: { 'X-AI-Service-Key': this.internalApiKey },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      logger.warn(`Backend data collection failed for ${path}`, { error });
      return null;
    }
  }
}
