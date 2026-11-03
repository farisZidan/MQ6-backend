// src/infrastructure/services/device-timeout.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { DeviceEntity } from '../database/entities/device.entity';
import { GasEventEntity } from '../database/entities/gas-event.entity';
import { DashboardGateway } from '../../presentation/websocket/dashboard.gateway';

@Injectable()
export class DeviceTimeoutService {
  private readonly logger = new Logger(DeviceTimeoutService.name);
  private readonly TIMEOUT_SECONDS = 30; // Timeout 30 detik

  constructor(
    @InjectRepository(DeviceEntity)
    private deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(GasEventEntity)
    private eventRepo: Repository<GasEventEntity>,
    private dashboardGateway: DashboardGateway,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async checkDeviceTimeouts() {
    const timeoutThreshold = new Date(Date.now() - this.TIMEOUT_SECONDS * 1000);

    // Cari perangkat ONLINE yang lastSeenAt lebih tua dari threshold
    const timedOutDevices = await this.deviceRepo.find({
      where: {
        connectionStatus: 'ONLINE',
        lastSeenAt: LessThan(timeoutThreshold),
      },
    });

    for (const device of timedOutDevices) {
      device.connectionStatus = 'OFFLINE';
      await this.deviceRepo.save(device);

      // Catat Event DEVICE_OFFLINE
      const event = this.eventRepo.create({
        deviceId: device.id,
        eventType: 'DEVICE_OFFLINE',
        severity: 'WARNING',
        description: `Perangkat ${device.deviceCode} terputus (OFFLINE) setelah ${this.TIMEOUT_SECONDS} detik tanpa pesan`,
        occurredAt: new Date(),
      });
      await this.eventRepo.save(event);

      // Broadcast event OFFLINE via WebSocket
      this.dashboardGateway.server.emit('device:status', {
        deviceId: device.deviceCode,
        status: 'OFFLINE',
        lastSeen: device.lastSeenAt,
      });

      this.logger.warn(
        `Perangkat ${device.deviceCode} berubah status menjadi OFFLINE`,
      );
    }
  }
}
