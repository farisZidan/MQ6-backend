import { Injectable, Logger, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SensorReadingEntity } from '../../infrastructure/database/entities/sensor-reading.entity';
import { DeviceEntity } from '../../infrastructure/database/entities/device.entity';
import { GasEventEntity } from '../../infrastructure/database/entities/gas-event.entity';
import {
  GasClassifier,
  GasStatusType,
} from '../../domain/services/gas-classifier.service';
import { DashboardGateway } from '../../presentation/websocket/dashboard.gateway';
import { SYSTEM_SETTING_REPOSITORY_PORT } from '../ports/system-setting.repository.port';
import type { ISystemSettingRepository } from '../ports/system-setting.repository.port';

export interface TelemetryPayloadDto {
  messageId: string;
  deviceId: string;
  rawValue: number;
  capturedAt: string;
  firmwareVersion?: string;
}

@Injectable()
export class IngestTelemetryUseCase {
  private readonly logger = new Logger(IngestTelemetryUseCase.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly dashboardGateway: DashboardGateway,
    @Inject(SYSTEM_SETTING_REPOSITORY_PORT)
    private readonly settingRepo: ISystemSettingRepository, // <-- Injeksi Port
  ) {}

  async execute(payload: TelemetryPayloadDto): Promise<void> {
    const receivedAt = new Date();

    if (
      !payload ||
      !payload.messageId ||
      !payload.deviceId ||
      payload.rawValue === undefined ||
      !payload.capturedAt
    ) {
      this.logger.warn(`[Ingest Rejected] Payload missing required fields`);
      return;
    }

    // 1. Ambil Konfigurasi dari Database
    const dbSettings = await this.settingRepo.getSettings();

    // 2. Buat Instance GasClassifier dengan Konfigurasi DB
    const classifier = new GasClassifier({
      warningThreshold: dbSettings.warningThreshold,
      dangerThreshold: dbSettings.dangerThreshold,
      hysteresisMargin: dbSettings.hysteresisMargin,
      adcMaxValue: dbSettings.adcMaxValue,
    });

    // 3. Validasi menggunakan instance classifier
    if (!classifier.isValidRawValue(payload.rawValue)) {
      this.logger.warn(
        `[Ingest Rejected] Invalid ADC rawValue (${payload.rawValue})`,
      );
      return;
    }

    if (!classifier.isValidCapturedAt(payload.capturedAt, receivedAt)) {
      this.logger.warn(`[Ingest Rejected] Invalid capturedAt timestamp`);
      return;
    }

    const { messageId, deviceId, rawValue, capturedAt, firmwareVersion } =
      payload;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let eventToEmitGas: GasEventEntity | null = null;
    let isStatusChanged = false;
    let isDeviceReconnected = false;
    let nextGasStatus: GasStatusType = 'NORMAL';

    try {
      let device = await queryRunner.manager.findOneBy(DeviceEntity, {
        deviceCode: deviceId,
      });

      if (!device) {
        device = queryRunner.manager.create(DeviceEntity, {
          deviceCode: deviceId,
          name: `Device ${deviceId}`,
          isActive: true,
          connectionStatus: 'ONLINE',
          firmwareVersion: firmwareVersion || undefined,
        });
        await queryRunner.manager.save(device);
      }

      const existingReading = await queryRunner.manager.findOne(
        SensorReadingEntity,
        {
          where: { deviceId: device.id, messageId },
        },
      );

      if (existingReading) {
        await queryRunner.rollbackTransaction();
        return;
      }

      const lastReading = await queryRunner.manager.findOne(
        SensorReadingEntity,
        {
          where: { deviceId: device.id },
          order: { capturedAt: 'DESC' },
        },
      );
      const previousGasStatus =
        (lastReading?.gasStatus as GasStatusType) || 'NORMAL';

      // 4. Klasifikasi menggunakan instance classifier yang baru
      nextGasStatus = classifier.classifyWithHysteresis(
        rawValue,
        previousGasStatus,
      );

      const reading = queryRunner.manager.create(SensorReadingEntity, {
        deviceId: device.id,
        messageId,
        rawValue,
        gasStatus: nextGasStatus,
        capturedAt: new Date(capturedAt),
        receivedAt,
      });
      await queryRunner.manager.save(reading);

      if (previousGasStatus !== nextGasStatus) {
        isStatusChanged = true;
        const severity =
          nextGasStatus === 'DANGER'
            ? 'CRITICAL'
            : nextGasStatus === 'WARNING'
              ? 'WARNING'
              : 'INFO';
        eventToEmitGas = queryRunner.manager.create(GasEventEntity, {
          deviceId: device.id,
          eventType: 'GAS_STATUS_CHANGED',
          severity,
          previousStatus: previousGasStatus,
          currentStatus: nextGasStatus,
          description: `Status gas berubah dari ${previousGasStatus} menjadi ${nextGasStatus} (ADC: ${rawValue})`,
          occurredAt: new Date(capturedAt),
        });
        await queryRunner.manager.save(eventToEmitGas);
      }

      if (device.connectionStatus === 'OFFLINE') {
        isDeviceReconnected = true;
        const onlineEvent = queryRunner.manager.create(GasEventEntity, {
          deviceId: device.id,
          eventType: 'DEVICE_ONLINE',
          severity: 'INFO',
          description: `Perangkat ${deviceId} kembali ONLINE`,
          occurredAt: receivedAt,
        });
        await queryRunner.manager.save(onlineEvent);
      }

      device.lastSeenAt = receivedAt;
      device.connectionStatus = 'ONLINE';
      if (firmwareVersion) device.firmwareVersion = firmwareVersion;
      await queryRunner.manager.save(device);

      await queryRunner.commitTransaction();
    } catch (err: any) {
      await queryRunner.rollbackTransaction();
      if (err?.code === '23505') {
        this.logger.warn(`[Deduplication DB Constraint] Duplicate message ID`);
      } else {
        this.logger.error(
          `[Ingest Error] Transaction failed: ${err?.message || err}`,
        );
      }
      return;
    } finally {
      await queryRunner.release();
    }

    this.dashboardGateway.sendSensorUpdate({
      deviceId,
      rawValue,
      gasStatus: nextGasStatus,
      capturedAt,
      receivedAt,
    });

    if (isStatusChanged && eventToEmitGas) {
      this.dashboardGateway.server.emit('gas:status-change', eventToEmitGas);
      this.dashboardGateway.server.emit('event:new', eventToEmitGas);
    }

    if (isDeviceReconnected) {
      this.dashboardGateway.server.emit('device:status', {
        deviceId,
        status: 'ONLINE',
        lastSeen: receivedAt,
      });
    }
  }
}
