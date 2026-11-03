// src/infrastructure/database/entities/device.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SensorReadingEntity } from './sensor-reading.entity';

@Entity('devices')
export class DeviceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, name: 'device_code' })
  deviceCode: string;

  @Column()
  name: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_seen_at' })
  lastSeenAt: Date;

  @Column({ default: 'UNKNOWN', name: 'connection_status' })
  connectionStatus: string; // ONLINE, OFFLINE, UNKNOWN

  @Column({ nullable: true, name: 'firmware_version' })
  firmwareVersion: string; // <-- Tambahan kolom ini

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SensorReadingEntity, (reading) => reading.device)
  readings: SensorReadingEntity[];
}
