// src/infrastructure/database/repositories/typeorm-sensor-reading.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import {
  ISensorReadingRepository,
  HistoryFilterOptions,
} from '../../../application/ports/sensor-reading.repository.port';
import { SensorReadingEntity } from '../entities/sensor-reading.entity';

@Injectable()
export class TypeOrmSensorReadingRepository implements ISensorReadingRepository {
  constructor(
    @InjectRepository(SensorReadingEntity)
    private readonly repo: Repository<SensorReadingEntity>,
  ) {}

  async findLatest(deviceId?: string): Promise<SensorReadingEntity | null> {
    const where: any = deviceId ? { deviceId } : {};
    return this.repo.findOne({
      where,
      order: { capturedAt: 'DESC' },
      relations: { device: true },
    });
  }

  async findHistory(
    options: HistoryFilterOptions,
  ): Promise<[SensorReadingEntity[], number]> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.from && options.to) {
      where.capturedAt = Between(options.from, options.to);
    } else if (options.from) {
      where.capturedAt = MoreThanOrEqual(options.from);
    } else if (options.to) {
      where.capturedAt = LessThanOrEqual(options.to);
    }

    return this.repo.findAndCount({
      where,
      order: { capturedAt: 'DESC' },
      take: limit,
      skip,
      relations: { device: true },
    });
  }

  async findByMessageId(
    deviceId: string,
    messageId: string,
  ): Promise<SensorReadingEntity | null> {
    return this.repo.findOne({ where: { deviceId, messageId } });
  }
}
