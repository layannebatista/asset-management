/**
 * Interface base para todos os collectors
 * Permite implementar diferentes fontes de dados de forma agnóstica
 */

export interface CollectionResult {
  source: string;
  success: boolean;
  error?: string;
  data?: any;
  itemsCollected: number;
  duration: number;
}

export interface ICollector {
  /**
   * Coleta dados entre duas datas
   */
  collect(startDate: Date, endDate: Date): Promise<CollectionResult>;

  /**
   * Nome do collector (para logging)
   */
  getName(): string;

  /**
   * Validação: collector está acessível?
   */
  validate(): Promise<boolean>;
}
