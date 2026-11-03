import { Injectable, Inject } from '@nestjs/common';
import type {
  ISensorReadingRepository,
  HistoryFilterOptions,
} from '../ports/sensor-reading.repository.port';
import { SENSOR_READING_REPOSITORY_PORT } from '../ports/sensor-reading.repository.port';

@Injectable()
export class GetReadingHistoryUseCase {
  constructor(
    @Inject(SENSOR_READING_REPOSITORY_PORT)
    private readonly readingRepo: ISensorReadingRepository,
  ) {}

  async execute(options: HistoryFilterOptions) {
    const [items, total] = await this.readingRepo.findHistory(options);
    const page = options.page || 1;
    const limit = Math.min(options.limit || 50, 100);

    return {
      items: items.map((r) => ({
        id: r.id,
        deviceId: r.device?.deviceCode || r.deviceId,
        messageId: r.messageId,
        rawValue: r.rawValue,
        gasStatus: r.gasStatus,
        capturedAt: r.capturedAt,
        receivedAt: r.receivedAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
