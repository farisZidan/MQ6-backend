import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { INotificationPort } from '../../application/ports/notification.port';
import {
  TELEGRAM_SUBSCRIBER_REPOSITORY_PORT,
} from '../../application/ports/telegram-subscriber.repository.port';
import type {
  ITelegramSubscriberRepository
} from '../../application/ports/telegram-subscriber.repository.port';

@Injectable()
export class TelegramAdapter implements INotificationPort {
  private readonly logger = new Logger(TelegramAdapter.name);
  private readonly botToken: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(TELEGRAM_SUBSCRIBER_REPOSITORY_PORT)
    private readonly subscriberRepo: ITelegramSubscriberRepository,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
  }

  // Kirim ke semua pelanggan
  async sendAlert(message: string): Promise<void> {
    const subscribers = await this.subscriberRepo.findAllActive();
    if (subscribers.length === 0) {
      this.logger.warn(
        '[Telegram] Tidak ada pelanggan aktif untuk dikirimi notifikasi.',
      );
      return;
    }

    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    const promises = subscribers.map((sub) =>
      lastValueFrom(
        this.httpService.post(url, {
          chat_id: sub.chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      ).catch((err) =>
        this.logger.error(
          `[Telegram] Gagal kirim ke ${sub.chatId}: ${err.message}`,
        ),
      ),
    );

    await Promise.all(promises);
    this.logger.log(
      `[Telegram] Alert broadcast terkirim ke ${subscribers.length} pelanggan.`,
    );
  }

  // Balasan privat untuk command /langganan atau /berhenti
  async sendDirectMessage(chatId: string, message: string): Promise<void> {
    if (!this.botToken) return;
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    try {
      await lastValueFrom(
        this.httpService.post(url, {
          chat_id: chatId,
          text: message,
        }),
      );
    } catch (error: any) {
      this.logger.error(
        `[Telegram] Gagal kirim DM ke ${chatId}: ${error.message}`,
      );
    }
  }
}
