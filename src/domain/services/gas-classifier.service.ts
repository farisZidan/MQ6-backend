// src/domain/services/gas-classifier.service.ts
export type GasStatusType = 'NORMAL' | 'WARNING' | 'DANGER';

export class GasClassifier {
  private static readonly ADC_MIN = 0;
  private static readonly ADC_MAX = 4095;
  private static readonly WARNING_THRESHOLD = 500;
  private static readonly DANGER_THRESHOLD = 750;
  private static readonly HYSTERESIS_MARGIN = 30;

  public static isValidRawValue(rawValue: number): boolean {
    return (
      Number.isInteger(rawValue) &&
      rawValue >= this.ADC_MIN &&
      rawValue <= this.ADC_MAX
    );
  }

  public static isValidCapturedAt(
    capturedAtStr: string,
    serverTime: Date = new Date(),
  ): boolean {
    console.log('[RANJAU 2 - CLASSIFIER] Evaluating capturedAt:', capturedAtStr, 'Current System Time:', new Date());

    const date = new Date(capturedAtStr);
    if (isNaN(date.getTime())) return false;

    // Batas toleransi waktu: capturedAt tidak boleh > 5 menit di masa depan
    // dan tidak boleh > 24 jam di masa lalu (clock drift / invalid RTC)
    const maxFuture = serverTime.getTime() + 5 * 60 * 1000;
    const maxPast = serverTime.getTime() - 24 * 60 * 60 * 1000;
    const capTime = date.getTime();

    return capTime >= maxPast && capTime <= maxFuture;
  }

  public static classifyWithHysteresis(
    rawValue: number,
    currentStatus: GasStatusType,
  ): GasStatusType {
    if (currentStatus === 'DANGER') {
      // Turun dari DANGER ke WARNING jika rawValue < (DANGER_THRESHOLD - HYSTERESIS_MARGIN)
      if (rawValue < this.DANGER_THRESHOLD - this.HYSTERESIS_MARGIN) {
        if (rawValue < this.WARNING_THRESHOLD - this.HYSTERESIS_MARGIN) {
          return 'NORMAL';
        }
        return 'WARNING';
      }
      return 'DANGER';
    }

    if (currentStatus === 'WARNING') {
      // Naik ke DANGER jika rawValue >= DANGER_THRESHOLD
      if (rawValue >= this.DANGER_THRESHOLD) {
        return 'DANGER';
      }
      // Turun ke NORMAL jika rawValue < (WARNING_THRESHOLD - HYSTERESIS_MARGIN)
      if (rawValue < this.WARNING_THRESHOLD - this.HYSTERESIS_MARGIN) {
        return 'NORMAL';
      }
      return 'WARNING';
    }

    // Default currentStatus === 'NORMAL'
    if (rawValue >= this.DANGER_THRESHOLD) {
      return 'DANGER';
    }
    if (rawValue >= this.WARNING_THRESHOLD) {
      return 'WARNING';
    }
    return 'NORMAL';
  }
}
