// src/application/ports/gas-event.repository.port.ts
import { GasEventEntity } from '../../infrastructure/database/entities/gas-event.entity';

export interface IGasEventRepository {
  findRecent(
    page?: number,
    limit?: number,
  ): Promise<[GasEventEntity[], number]>;
}
export const GAS_EVENT_REPOSITORY_PORT = Symbol('IGasEventRepository');
