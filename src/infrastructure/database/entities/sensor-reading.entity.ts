// src/infrastructure/database/entities/sensor-reading.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { DeviceEntity } from './device.entity';

@Entity('sensor_readings')
@Unique('UQ_DEVICE_MESSAGE', ['deviceId', 'messageId'])
@Index('IDX_DEVICE_CAPTURED', ['deviceId', 'capturedAt'])
export class SensorReadingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'device_id' })
  deviceId: string;

  @ManyToOne(() => DeviceEntity, (device) => device.readings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'device_id' })
  device: DeviceEntity;

  @Column({ name: 'message_id' })
  messageId: string;

  @Column({ type: 'int', name: 'raw_value' })
  rawValue: number;

  @Column({ name: 'gas_status' })
  gasStatus: string;

  @Column({ type: 'timestamptz', name: 'captured_at' })
  capturedAt: Date;

  @Column({ type: 'timestamptz', name: 'received_at' })
  receivedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
