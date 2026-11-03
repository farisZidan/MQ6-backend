// src/presentation/http/controllers/sensors.controller.ts
import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { GetDashboardSummaryUseCase } from '../../../application/use-cases/get-dashboard-summary.use-case';
import { GetReadingHistoryUseCase } from '../../../application/use-cases/get-reading-history.use-case';
import { GetRecentEventsUseCase } from '../../../application/use-cases/get-recent-events.use-case';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceEntity } from '../../../infrastructure/database/entities/device.entity';
import { SensorReadingEntity } from '../../../infrastructure/database/entities/sensor-reading.entity';

@Controller('api/v1')
export class SensorsController {
  constructor(
    private readonly getDashboardSummaryUseCase: GetDashboardSummaryUseCase,
    private readonly getReadingHistoryUseCase: GetReadingHistoryUseCase,
    private readonly getRecentEventsUseCase: GetRecentEventsUseCase,
    @InjectRepository(DeviceEntity)
    private deviceRepo: Repository<DeviceEntity>,
    @InjectRepository(SensorReadingEntity)
    private readingRepo: Repository<SensorReadingEntity>,
  ) {}

  @Get('dashboard')
  async getDashboard() {
    const data = await this.getDashboardSummaryUseCase.execute();
    return { success: true, data };
  }

  @Get('health')
  async getHealth() {
    let dbStatus = 'UP';
    try {
      await this.deviceRepo.query('SELECT 1');
    } catch {
      dbStatus = 'DOWN';
    }

    return {
      status: dbStatus === 'UP' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        backend: 'UP',
      },
    };
  }

  @Get('sensors/latest')
  async getLatest() {
    const latest = await this.readingRepo.findOne({
      where: {},
      order: { capturedAt: 'DESC' },
      relations: { device: true },
    });
    return { success: true, data: latest };
  }

  @Get('sensors/history')
  async getHistory(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    if (fromDate && isNaN(fromDate.getTime())) {
      throw new BadRequestException(
        'Parameter "from" harus bertipe ISO-8601 string yang valid',
      );
    }
    if (toDate && isNaN(toDate.getTime())) {
      throw new BadRequestException(
        'Parameter "to" harus bertipe ISO-8601 string yang valid',
      );
    }
    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException(
        'Parameter "from" tidak boleh lebih besar dari "to"',
      );
    }

    const data = await this.getReadingHistoryUseCase.execute({
      from: fromDate,
      to: toDate,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 50,
    });

    return { success: true, data };
  }

  @Get('events')
  async getEvents(@Query('page') page = '1', @Query('limit') limit = '20') {
    const data = await this.getRecentEventsUseCase.execute(
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
    return { success: true, data };
  }

  @Get('devices/status')
  async getDeviceStatus() {
    const devices = await this.deviceRepo.find();
    return { success: true, data: devices };
  }
}
