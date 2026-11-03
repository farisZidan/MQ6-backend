// src/application/ports/device.repository.port.ts
import { DeviceEntity } from '../../infrastructure/database/entities/device.entity';

export interface IDeviceRepository {
  findByCode(deviceCode: string): Promise<DeviceEntity | null>;
  findById(id: string): Promise<DeviceEntity | null>;
  createAndSave(deviceCode: string, name?: string): Promise<DeviceEntity>;
  updateLastSeen(
    id: string,
    status: 'ONLINE' | 'OFFLINE',
    lastSeenAt: Date,
  ): Promise<void>;
  findAll(): Promise<DeviceEntity[]>;
  findTimedOutDevices(timeoutThreshold: Date): Promise<DeviceEntity[]>;
}
export const DEVICE_REPOSITORY_PORT = Symbol('IDeviceRepository');
