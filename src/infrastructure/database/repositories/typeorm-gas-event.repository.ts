// src/infrastructure/database/repositories/typeorm-gas-event.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IGasEventRepository } from '../../../application/ports/gas-event.repository.port';
import { GasEventEntity } from '../entities/gas-event.entity';

@Injectable()
export class TypeOrmGasEventRepository implements IGasEventRepository {
  constructor(
    @InjectRepository(GasEventEntity)
    private readonly repo: Repository<GasEventEntity>,
  ) {}

  async findRecent(page = 1, limit = 20): Promise<[GasEventEntity[], number]> {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    return this.repo.findAndCount({
      order: { occurredAt: 'DESC' },
      take,
      skip,
      relations: { device: true },
    });
  }
}
