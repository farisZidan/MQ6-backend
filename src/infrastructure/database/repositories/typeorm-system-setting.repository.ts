import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISystemSettingRepository } from '../../../application/ports/system-setting.repository.port';
import { SystemSettingEntity } from '../entities/system-setting.entity';

@Injectable()
export class TypeOrmSystemSettingRepository implements ISystemSettingRepository {
  constructor(
    @InjectRepository(SystemSettingEntity)
    private readonly repository: Repository<SystemSettingEntity>,
  ) {}

  async getSettings(): Promise<SystemSettingEntity> {
    let settings = await this.repository.findOne({ where: {} });
    if (!settings) {
      // Jika tabel kosong, buat baris default
      settings = this.repository.create({
        warningThreshold: 500,
        dangerThreshold: 750,
        hysteresisMargin: 30,
        adcMaxValue: 1023,
      });
      await this.repository.save(settings);
    }
    return settings;
  }

  async updateSettings(
    updateData: Partial<SystemSettingEntity>,
  ): Promise<SystemSettingEntity> {
    const settings = await this.getSettings();
    Object.assign(settings, updateData);
    return this.repository.save(settings);
  }
}
