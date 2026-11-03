import { Injectable, Inject } from '@nestjs/common';
import type { ISensorReadingRepository } from '../ports/sensor-reading.repository.port';
import { SENSOR_READING_REPOSITORY_PORT } from '../ports/sensor-reading.repository.port';
import type { IDeviceRepository } from '../ports/device.repository.port';
import { DEVICE_REPOSITORY_PORT } from '../ports/device.repository.port';
import type { IGasEventRepository } from '../ports/gas-event.repository.port';
import { GAS_EVENT_REPOSITORY_PORT } from '../ports/gas-event.repository.port';

@Injectable()
export class GetDashboardSummaryUseCase {
  constructor(
    @Inject(SENSOR_READING_REPOSITORY_PORT)
    private readonly readingRepo: ISensorReadingRepository,
    @Inject(DEVICE_REPOSITORY_PORT)
    private readonly deviceRepo: IDeviceRepository,
    @Inject(GAS_EVENT_REPOSITORY_PORT)
    private readonly eventRepo: IGasEventRepository,
  ) {}

  async execute() {
    const latestReading = await this.readingRepo.findLatest();
    const devices = await this.deviceRepo.findAll();
    const [recentEvents] = await this.eventRepo.findRecent(1, 5);

    const primaryDevice = devices[0] || null;

    return {
      latestReading: latestReading
        ? {
            deviceId: latestReading.device?.deviceCode || null,
            rawValue: latestReading.rawValue,
            gasStatus: latestReading.gasStatus,
            capturedAt: latestReading.capturedAt,
            receivedAt: latestReading.receivedAt,
          }
        : null,
      deviceStatus: primaryDevice
        ? {
            deviceId: primaryDevice.deviceCode,
            status: primaryDevice.connectionStatus,
            lastSeenAt: primaryDevice.lastSeenAt,
            firmwareVersion: primaryDevice.firmwareVersion,
          }
        : { status: 'UNKNOWN', lastSeenAt: null },
      recentEvents: recentEvents.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        severity: e.severity,
        previousStatus: e.previousStatus,
        currentStatus: e.currentStatus,
        description: e.description,
        occurredAt: e.occurredAt,
      })),
    };
  }
}
