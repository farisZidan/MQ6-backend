import { SystemSettingEntity } from '../../infrastructure/database/entities/system-setting.entity';

export const SYSTEM_SETTING_REPOSITORY_PORT = 'ISystemSettingRepository';

export interface ISystemSettingRepository {
  getSettings(): Promise<SystemSettingEntity>;
  updateSettings(
    settings: Partial<SystemSettingEntity>,
  ): Promise<SystemSettingEntity>;
}
