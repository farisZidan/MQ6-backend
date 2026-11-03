import { Injectable, Inject } from '@nestjs/common';
import type { IGasEventRepository } from '../ports/gas-event.repository.port';
import { GAS_EVENT_REPOSITORY_PORT } from '../ports/gas-event.repository.port';

@Injectable()
export class GetRecentEventsUseCase {
  constructor(
    @Inject(GAS_EVENT_REPOSITORY_PORT)
    private readonly eventRepo: IGasEventRepository,
  ) {}

  async execute(page = 1, limit = 20) {
    const [items, total] = await this.eventRepo.findRecent(page, limit);
    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
