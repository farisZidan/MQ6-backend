// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entities (Database Layer)
import { DeviceEntity } from './infrastructure/database/entities/device.entity';
import { SensorReadingEntity } from './infrastructure/database/entities/sensor-reading.entity';
import { GasEventEntity } from './infrastructure/database/entities/gas-event.entity';

// Repository Implementations (Infrastructure Layer)
import { TypeOrmDeviceRepository } from './infrastructure/database/repositories/typeorm-device.repository';
import { TypeOrmSensorReadingRepository } from './infrastructure/database/repositories/typeorm-sensor-reading.repository';
import { TypeOrmGasEventRepository } from './infrastructure/database/repositories/typeorm-gas-event.repository';

// Repository Ports / Tokens (Application Layer)
import { DEVICE_REPOSITORY_PORT } from './application/ports/device.repository.port';
import { SENSOR_READING_REPOSITORY_PORT } from './application/ports/sensor-reading.repository.port';
import { GAS_EVENT_REPOSITORY_PORT } from './application/ports/gas-event.repository.port';

// Use Cases (Application Layer)
import { IngestTelemetryUseCase } from './application/use-cases/ingest-telemetry.use-case';
import { GetDashboardSummaryUseCase } from './application/use-cases/get-dashboard-summary.use-case';
import { GetReadingHistoryUseCase } from './application/use-cases/get-reading-history.use-case';
import { GetRecentEventsUseCase } from './application/use-cases/get-recent-events.use-case';

// Infrastructure & Presentation Services
import { MqttClientService } from './infrastructure/mqtt/mqtt-client.service';
import { DeviceTimeoutService } from './infrastructure/services/device-timeout.service';
import { TelemetryConsumer } from './presentation/mqtt/telemetry.consumer';
import { DashboardGateway } from './presentation/websocket/dashboard.gateway';
import { SensorsController } from './presentation/http/sensors/sensors.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(String(process.env.DB_PORT), 10) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'secretpassword',
      database: process.env.DB_NAME || 'lpg_monitoring',
      entities: [DeviceEntity, SensorReadingEntity, GasEventEntity],
      synchronize: true, // Otomatis generate tabel saat development
    }),
    TypeOrmModule.forFeature([
      DeviceEntity,
      SensorReadingEntity,
      GasEventEntity,
    ]),
  ],
  controllers: [SensorsController],
  providers: [
    // 1. Binding Interface Port ke Implementasi TypeORM (Clean Architecture DI)
    {
      provide: DEVICE_REPOSITORY_PORT,
      useClass: TypeOrmDeviceRepository,
    },
    {
      provide: SENSOR_READING_REPOSITORY_PORT,
      useClass: TypeOrmSensorReadingRepository,
    },
    {
      provide: GAS_EVENT_REPOSITORY_PORT,
      useClass: TypeOrmGasEventRepository,
    },

    // Registrasi Kelas Repository Konkret
    TypeOrmDeviceRepository,
    TypeOrmSensorReadingRepository,
    TypeOrmGasEventRepository,

    // 2. Use Cases (Application Business Logic)
    IngestTelemetryUseCase,
    GetDashboardSummaryUseCase,
    GetReadingHistoryUseCase,
    GetRecentEventsUseCase,

    // 3. Infrastructure & Presentation Services
    MqttClientService,
    TelemetryConsumer,
    DeviceTimeoutService,
    DashboardGateway,
  ],
})
export class AppModule {}
