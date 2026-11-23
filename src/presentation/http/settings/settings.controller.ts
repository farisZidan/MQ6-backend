import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, Min, Max } from 'class-validator'; // <-- Import ini
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ManageSettingsUseCase } from '../../../application/use-cases/manage-settings.use-case';

export class UpdateSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1023) // Sesuaikan dengan ADC max-mu
  warningThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1023)
  dangerThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hysteresisMargin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  adcMaxValue?: number;
}

@Controller('api/v1/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly manageSettingsUseCase: ManageSettingsUseCase) {}

  @Get()
  async getSettings() {
    const settings = await this.manageSettingsUseCase.getSettings();
    return { success: true, data: settings };
  }

  @Patch()
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    const updated = await this.manageSettingsUseCase.updateSettings(dto);
    return { success: true, data: updated };
  }
}
