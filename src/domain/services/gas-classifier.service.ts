// src/domain/services/gas-classifier.service.ts

export type GasStatusType = 'NORMAL' | 'WARNING' | 'DANGER';

export interface GasThresholdConfig {
  warningThreshold: number;
  dangerThreshold: number;
  hysteresisMargin: number;
  adcMaxValue: number;
}

export class GasClassifier {
  private readonly config: GasThresholdConfig;

  constructor(config: GasThresholdConfig) {
    // Validasi invariant Domain: WARNING harus lebih kecil dari DANGER
    if (config.warningThreshold >= config.dangerThreshold) {
      throw new Error(
        'Konfigurasi tidak valid: Warning threshold harus lebih kecil dari Danger threshold.',
      );
    }
    this.config = config;
  }

  public isValidRawValue(rawValue: number): boolean {
    return (
      Number.isInteger(rawValue) &&
      rawValue >= 0 &&
      rawValue <= this.config.adcMaxValue
    );
  }

  public isValidCapturedAt(
    capturedAtStr: string,
    serverTime: Date = new Date(),
  ): boolean {
    const date = new Date(capturedAtStr);
    if (isNaN(date.getTime())) return false;

    const maxFuture = serverTime.getTime() + 5 * 60 * 1000;
    const maxPast = serverTime.getTime() - 24 * 60 * 60 * 1000;
    const capTime = date.getTime();

    return capTime >= maxPast && capTime <= maxFuture;
  }

  public classifyWithHysteresis(
    rawValue: number,
    currentStatus: GasStatusType,
  ): GasStatusType {
    const { warningThreshold, dangerThreshold, hysteresisMargin } = this.config;

    if (currentStatus === 'DANGER') {
      if (rawValue < dangerThreshold - hysteresisMargin) {
        if (rawValue < warningThreshold - hysteresisMargin) {
          return 'NORMAL';
        }
        return 'WARNING';
      }
      return 'DANGER';
    }

    if (currentStatus === 'WARNING') {
      if (rawValue >= dangerThreshold) {
        return 'DANGER';
      }
      if (rawValue < warningThreshold - hysteresisMargin) {
        return 'NORMAL';
      }
      return 'WARNING';
    }

    // Default currentStatus === 'NORMAL'
    if (rawValue >= dangerThreshold) {
      return 'DANGER';
    }
    if (rawValue >= warningThreshold) {
      return 'WARNING';
    }
    return 'NORMAL';
  }
}
