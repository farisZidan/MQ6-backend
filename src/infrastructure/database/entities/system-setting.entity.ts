import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('system_settings')
export class SystemSettingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'warning_threshold', type: 'int', default: 500 })
  warningThreshold: number;

  @Column({ name: 'danger_threshold', type: 'int', default: 750 })
  dangerThreshold: number;

  @Column({ name: 'hysteresis_margin', type: 'int', default: 30 })
  hysteresisMargin: number;

  @Column({ name: 'adc_max_value', type: 'int', default: 1023 })
  adcMaxValue: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
