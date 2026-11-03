// src/application/ports/sensor-reading.repository.port.ts
import { SensorReadingEntity } from '../../infrastructure/database/entities/sensor-reading.entity';

export interface HistoryFilterOptions {
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface ISensorReadingRepository {
  findLatest(deviceId?: string): Promise<SensorReadingEntity | null>;
  findHistory(
    options: HistoryFilterOptions,
  ): Promise<[SensorReadingEntity[], number]>;
  findByMessageId(
    deviceId: string,
    messageId: string,
  ): Promise<SensorReadingEntity | null>;
}
export const SENSOR_READING_REPOSITORY_PORT = Symbol(
  'ISensorReadingRepository',
);
