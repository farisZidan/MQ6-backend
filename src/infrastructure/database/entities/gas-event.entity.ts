// src\application\use-cases\ingest-telemetry.use-case.tssrc\application\use-cases\ingest-telemetry.use-case.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DeviceEntity } from './device.entity';

@Entity('gas_events')
export class GasEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'device_id' })
  deviceId: string;

  @ManyToOne(() => DeviceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: DeviceEntity;

  @Column({ name: 'event_type' })
  eventType: string; // STATUS_CHANGED, DEVICE_OFFLINE, DEVICE_ONLINE

  @Column({ name: 'severity' })
  severity: string; // INFO, WARNING, CRITICAL

  @Column({ name: 'previous_status', nullable: true })
  previousStatus: string;

  @Column({ name: 'current_status', nullable: true })
  currentStatus: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamptz', name: 'occurred_at' })
  occurredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
