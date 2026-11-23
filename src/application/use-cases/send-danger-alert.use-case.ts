import { Injectable, Inject, Logger } from '@nestjs/common';
import { NOTIFICATION_PORT } from '../ports/notification.port';
import type { INotificationPort } from '../ports/notification.port';

@Injectable()
export class SendDangerAlertUseCase {
  private readonly logger = new Logger(SendDangerAlertUseCase.name);

  constructor(
    @Inject(NOTIFICATION_PORT)
    private readonly notificationPort: INotificationPort,
  ) {}

  async execute(
    deviceId: string,
    rawValue: number,
    status: string,
  ): Promise<void> {
    this.logger.log(`[Alert] Mempersiapkan alert DANGER untuk ${deviceId}`);

    const message =
      `🚨 *PERINGATAN BAHAYA GAS LPG* 🚨\n\n` +
      `*Device*: ${deviceId}\n` +
      `*Status*: ${status}\n` +
      `*Nilai ADC*: ${rawValue}\n` +
      `*Waktu*: ${new Date().toLocaleString('id-ID')}\n\n` +
      `Segera periksa kondisi sekitar!`;

    await this.notificationPort.sendAlert(message);
  }
}
