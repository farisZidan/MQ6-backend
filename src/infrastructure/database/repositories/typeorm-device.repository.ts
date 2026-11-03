// src/infrastructure/database/repositories/typeorm-device.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { IDeviceRepository } from '../../../application/ports/device.repository.port';
import { DeviceEntity } from '../entities/device.entity';

@Injectable()
export class TypeOrmDeviceRepository implements IDeviceRepository {
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly repo: Repository<DeviceEntity>,
  ) {}

  async findByCode(deviceCode: string): Promise<DeviceEntity | null> {
    return this.repo.findOne({ where: { deviceCode } });
  }

  async findById(id: string): Promise<DeviceEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async createAndSave(
    deviceCode: string,
    name?: string,
  ): Promise<DeviceEntity> {
    const device = this.repo.create({
      deviceCode,
      name: name || `Device ${deviceCode}`,
      isActive: true,
      connectionStatus: 'ONLINE',
    });
    return this.repo.save(device);
  }

  async updateLastSeen(
    id: string,
    status: 'ONLINE' | 'OFFLINE',
    lastSeenAt: Date,
  ): Promise<void> {
    await this.repo.update(id, { connectionStatus: status, lastSeenAt });
  }

  async findAll(): Promise<DeviceEntity[]> {
    return this.repo.find({ order: { createdAt: 'ASC' } });
  }

  async findTimedOutDevices(timeoutThreshold: Date): Promise<DeviceEntity[]> {
    return this.repo.find({
      where: {
        connectionStatus: 'ONLINE',
        lastSeenAt: LessThan(timeoutThreshold),
      },
    });
  }
}
