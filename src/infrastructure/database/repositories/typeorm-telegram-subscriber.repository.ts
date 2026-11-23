import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITelegramSubscriberRepository } from '../../../application/ports/telegram-subscriber.repository.port';
import { TelegramSubscriberEntity } from '../entities/telegram-subscriber.entity';

@Injectable()
export class TypeOrmTelegramSubscriberRepository implements ITelegramSubscriberRepository {
  constructor(
    @InjectRepository(TelegramSubscriberEntity)
    private readonly repo: Repository<TelegramSubscriberEntity>,
  ) {}

  async upsertSubscriber(chatId: string, username?: string): Promise<void> {
    // Jika sudah ada, aktifkan kembali. Jika belum, buat baru.
    await this.repo.upsert({ chatId, username, isActive: true }, ['chatId']);
  }

  async deactivateSubscriber(chatId: string): Promise<void> {
    await this.repo.update({ chatId }, { isActive: false });
  }

  async findAllActive(): Promise<TelegramSubscriberEntity[]> {
    return this.repo.find({ where: { isActive: true } });
  }
}
