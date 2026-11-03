// src/application/use-cases/ingest-telemetry.use-case.ts
import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SensorReadingEntity } from '../../infrastructure/database/entities/sensor-reading.entity';
import { DeviceEntity } from '../../infrastructure/database/entities/device.entity';
import { GasEventEntity } from '../../infrastructure/database/entities/gas-event.entity';
import {
  GasClassifier,
  GasStatusType,
} from '../../domain/services/gas-classifier.service';
import { DashboardGateway } from '../../presentation/websocket/dashboard.gateway';

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
  ) {}

  async execute(payload: TelemetryPayloadDto): Promise<void> {
    const receivedAt = new Date();
    console.log(
      '[RANJAU 3 - USECASE] Starting ingest for messageId:',
      payload.messageId,
    );

    // 1. Validasi Schema DTO Dasar
    if (
      !payload ||
      !payload.messageId ||
      !payload.deviceId ||
      payload.rawValue === undefined ||
      !payload.capturedAt
    ) {
      this.logger.warn(
        `[Ingest Rejected] Payload missing required fields: ${JSON.stringify(payload)}`,
      );
      return;
    }

    // 2. Validasi ADC Range (0-4095)
    if (!GasClassifier.isValidRawValue(payload.rawValue)) {
      this.logger.warn(
        `[Ingest Rejected] Invalid ADC rawValue (${payload.rawValue}) from ${payload.deviceId}`,
      );
      return;
    }

    // 3. Validasi Time Range
    if (!GasClassifier.isValidCapturedAt(payload.capturedAt, receivedAt)) {
      this.logger.warn(
        `[Ingest Rejected] Invalid capturedAt timestamp (${payload.capturedAt}) from ${payload.deviceId}`,
      );
      return;
    }

    const { messageId, deviceId, rawValue, capturedAt, firmwareVersion } =
      payload;

    // Inisialisasi DB Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let eventToEmitGas: GasEventEntity | null = null;
    let isStatusChanged = false;
    let isDeviceReconnected = false;
    let nextGasStatus: GasStatusType = 'NORMAL';

    try {
      // Step 3: Check / Register Device (Auto-provisioning)
      let device = await queryRunner.manager.findOneBy(DeviceEntity, {
        deviceCode: deviceId,
      });

      if (!device) {
        device = queryRunner.manager.create(DeviceEntity, {
          deviceCode: deviceId,
          name: `Device ${deviceId}`,
          isActive: true,
          connectionStatus: 'ONLINE',
          firmwareVersion: firmwareVersion || undefined, // PERBAIKAN: Ubah null menjadi undefined
        });
        await queryRunner.manager.save(device);
        this.logger.log(
          `[Auto-provisioning] Device baru terdaftar: ${deviceId}`,
        );
      }

      // Step 4: Deduplikasi messageId
      const existingReading = await queryRunner.manager.findOne(
        SensorReadingEntity,
        {
          where: { deviceId: device.id, messageId },
        },
      );

      if (existingReading) {
        this.logger.warn(
          `[Deduplication] Message ID ${messageId} sudah ada untuk device ${deviceId}. Ingest diabaikan.`,
        );
        await queryRunner.rollbackTransaction();
        return;
      }

      // Step 6: Ambil status sebelumnya
      const lastReading = await queryRunner.manager.findOne(
        SensorReadingEntity,
        {
          where: { deviceId: device.id },
          order: { capturedAt: 'DESC' },
        },
      );
      const previousGasStatus =
        (lastReading?.gasStatus as GasStatusType) || 'NORMAL';

      // Step 5: Klasifikasi dengan Hysteresis
      nextGasStatus = GasClassifier.classifyWithHysteresis(
        rawValue,
        previousGasStatus,
      );

      // Step 7: Simpan sensor_readings
      const reading = queryRunner.manager.create(SensorReadingEntity, {
        deviceId: device.id,
        messageId,
        rawValue,
        gasStatus: nextGasStatus,
        capturedAt: new Date(capturedAt),
        receivedAt,
      });
      await queryRunner.manager.save(reading);

      // Step 8: Catat Transisi Status
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

      // Step 9: Check reconnect & Update last_seen
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

      // Step 10: Commit DB
      await queryRunner.commitTransaction();
    } catch (err: any) {
      console.error('[RANJAU 3 - ERROR CATCHED]:', err.message, err.stack);

      await queryRunner.rollbackTransaction();
      if (err?.code === '23505') {
        this.logger.warn(`[Deduplication DB Constraint] Message ID duplicate violation: ${messageId}`);
      } else {
        this.logger.error(`[Ingest Error] Transaction failed: ${err?.message || err}`);
      }
      return;
    } finally {
      await queryRunner.release();
    }

    // Step 11: Push WebSocket Realtime Update
    this.dashboardGateway.sendSensorUpdate({
      deviceId,
      rawValue,
      gasStatus: nextGasStatus,
      capturedAt,
      receivedAt,
    });

    // Step 12: Push WebSocket Events jika terjadi transisi
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
