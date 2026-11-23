import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SYSTEM_SETTING_REPOSITORY_PORT } from '../ports/system-setting.repository.port';
import type { ISystemSettingRepository } from '../ports/system-setting.repository.port';
import { SystemSettingEntity } from '../../infrastructure/database/entities/system-setting.entity';

@Injectable()
export class ManageSettingsUseCase {
  constructor(
    @Inject(SYSTEM_SETTING_REPOSITORY_PORT)
    private readonly repo: ISystemSettingRepository,
  ) {}

  async getSettings(): Promise<SystemSettingEntity> {
    return this.repo.getSettings();
  }

  async updateSettings(
    data: Partial<SystemSettingEntity>,
  ): Promise<SystemSettingEntity> {
    // Validasi Invariant Domain
    if (
      data.warningThreshold !== undefined &&
      data.dangerThreshold !== undefined
    ) {
      if (data.warningThreshold >= data.dangerThreshold) {
        throw new BadRequestException(
          'Warning threshold harus lebih kecil dari Danger threshold',
        );
      }
    }

    return this.repo.updateSettings(data);
  }
}