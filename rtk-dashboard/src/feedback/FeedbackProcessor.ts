import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { DecisionOutput } from '../types/DecisionOutput';

export interface FeedbackSignal {
  decision_id: string;
  feedback_type: 'positive' | 'negative' | 'partial';
  user_id: string;
  actual_outcome?: {
    resolved: boolean;
    time_to_resolution_minutes: number;
    business_impact_score: number;
  };
  notes?: string;
  timestamp: Date;
}

export interface ContextBoost {
  pattern_hash: string;
  boost_factor: number;
  confidence: number;
  applied_since: Date;
}

export class FeedbackProcessor extends EventEmitter {
  private readonly logger: Logger;
  private readonly QUALITY_THRESHOLD = 0.70;
  private readonly MAX_BOOST = 2.0;
  private readonly MIN_BOOST = 0.5;
  private boost_map: Map<string, number> = new Map();

  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }

  async processFeedback(decision: DecisionOutput, feedback: FeedbackSignal): Promise<{ reprocessed: boolean; boosted_contexts?: ContextBoost[] }> {
    this.logger.info('Processing feedback', {
      decision_id: decision.metadata.analysisId,
      feedback_type: feedback.feedback_type,
    });

    if (feedback.feedback_type === 'positive') {
      const boosts = this.applyContextBoosts(decision);
      this.emit('context_boosted', { decision_id: decision.metadata.analysisId, boosts });
      return { reprocessed: false, boosted_contexts: boosts };
    }

    if (feedback.feedback_type === 'negative' && decision.metrics.quality_score < this.QUALITY_THRESHOLD) {
      this.logger.warn('Quality threshold violated, should reprocess', {
        quality: decision.metrics.quality_score,
      });
      return { reprocessed: true };
    }

    return { reprocessed: false };
  }

  private applyContextBoosts(decision: DecisionOutput): ContextBoost[] {
    const pattern_hash = `${decision.metadata.type}:${decision.metadata.criticality}`;
    const current_boost = this.boost_map.get(pattern_hash) || 1.0;
    const new_boost = Math.min(current_boost + 0.1, this.MAX_BOOST);

    this.boost_map.set(pattern_hash, new_boost);

    const boost: ContextBoost = {
      pattern_hash,
      boost_factor: new_boost,
      confidence: Math.min(0.9, (new_boost - 1.0) * 0.5 + 0.5),
      applied_since: new Date(),
    };

    this.logger.info('Context boost applied', { pattern: pattern_hash, new_boost });
    return [boost];
  }

  getBoostFactor(pattern_hash: string): number {
    return this.boost_map.get(pattern_hash) || 1.0;
  }
}
