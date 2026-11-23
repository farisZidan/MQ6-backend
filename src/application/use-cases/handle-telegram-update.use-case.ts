import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  TELEGRAM_SUBSCRIBER_REPOSITORY_PORT,
} from '../ports/telegram-subscriber.repository.port';
import type {
  ITelegramSubscriberRepository,
} from '../ports/telegram-subscriber.repository.port';
import {
  NOTIFICATION_PORT,
} from '../ports/notification.port';
import type {
  INotificationPort
} from '../ports/notification.port';

@Injectable()
export class HandleTelegramUpdateUseCase {
  private readonly logger = new Logger(HandleTelegramUpdateUseCase.name);

  constructor(
    @Inject(TELEGRAM_SUBSCRIBER_REPOSITORY_PORT)
    private readonly subscriberRepo: ITelegramSubscriberRepository,
    @Inject(NOTIFICATION_PORT)
    private readonly notificationPort: INotificationPort,
  ) {}

  async execute(chatId: string, username: string, text: string): Promise<void> {
    // 1. Bersihkan teks dari spasi di awal/akhir dan jadikan huruf kecil
    const cleanText = text.trim().toLowerCase();

    // 2. Log untuk debugging (lihat di terminal apa isi teks aslinya)
    this.logger.debug(
      `[Telegram Bot] Menerima pesan: "${text}" dari ${username} (${chatId})`,
    );

    // 3. Cek menggunakan .includes() agar lebih toleran terhadap spasi atau format aneh
    if (cleanText.includes('/langganan')) {
      await this.subscriberRepo.upsertSubscriber(chatId, username);
      await this.notificationPort.sendDirectMessage(
        chatId,
        '✅ Berhasil! Anda akan menerima notifikasi jika ada bahaya kebocoran gas.',
      );
      this.logger.log(`[Telegram Bot] ${username} berlangganan.`);
    } else if (cleanText.includes('/berhenti')) {
      await this.subscriberRepo.deactivateSubscriber(chatId);
      await this.notificationPort.sendDirectMessage(
        chatId,
        '❌ Anda telah berhenti berlangganan. Notifikasi tidak akan dikirim lagi.',
      );
      this.logger.log(`[Telegram Bot] ${username} berhenti berlangganan.`);
    } else if (cleanText.includes('/start')) {
      await this.notificationPort.sendDirectMessage(
        chatId,
        'Selamat datang di Bot Monitoring Gas LPG!\n\nKetik /langganan untuk mulai menerima peringatan bahaya.',
      );
    } else {
      await this.notificationPort.sendDirectMessage(
        chatId,
        'Perintah tidak dikenal.\nKetik /langganan untuk mendaftar, atau /berhenti untuk berhenti.',
      );
    }
  }
}
