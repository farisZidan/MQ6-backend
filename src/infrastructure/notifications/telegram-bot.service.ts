import {
  Injectable,
  OnModuleInit,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HandleTelegramUpdateUseCase } from '../../application/use-cases/handle-telegram-update.use-case';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TelegramModule = require('node-telegram-bot-api');

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  // Gunakan 'any' karena kita ambil class secara dinamis
  private bot: any;
  private readonly logger = new Logger(TelegramBotService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly handleUpdateUseCase: HandleTelegramUpdateUseCase,
  ) {}

  onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn(
        '[Telegram] BOT_TOKEN tidak ada. Bot listener dimatikan.',
      );
      return;
    }

    // Ambil class 'Bot' dari modul (Ini adalah Telegraf Bot)
    const BotConstructor =
      TelegramModule.Bot || TelegramModule.Telegraf || TelegramModule.default;

    if (typeof BotConstructor !== 'function') {
      this.logger.error(
        '[Telegram] Gagal menemukan constructor Bot. Cek modul.',
      );
      return;
    }

    // Inisialisasi bot
    this.bot = new BotConstructor(token);
    this.logger.log(
      '[Telegram] Bot Listener aktif. Menunggu pesan /langganan...',
    );

    // Dengarkan pesan masuk
     this.bot.on('message', async (ctx: any) => {
       const chatId = ctx.chat.id.toString();

       // Perbaikan Username: Gunakan first_name jika username kosong
       const username =
         ctx.from?.username || ctx.from?.first_name || 'User Tanpa Username';

       // Perbaikan Teks: Telegraf menyimpan command di ctx.message.text atau ctx.update.message.text
       const text = ctx.message?.text || ctx.update?.message?.text || '';

       this.logger.debug(`[TelegramBotService] Raw text received: "${text}"`); // Log untuk memastikan

       await this.handleUpdateUseCase.execute(chatId, username, text);
     });

    // Jalankan polling (Telegraf butuh launch)
    if (typeof this.bot.launch === 'function') {
      this.bot.launch();
    } else if (typeof this.bot.startPolling === 'function') {
      this.bot.startPolling();
    } else {
      this.logger.warn(
        '[Telegram] Tidak ada metode launch/startPolling yang dikenal.',
      );
    }
  }

  onModuleDestroy() {
    if (this.bot) {
      if (typeof this.bot.stop === 'function') {
        this.bot.stop('NestJS shutdown');
      } else if (typeof this.bot.stopPolling === 'function') {
        this.bot.stopPolling();
      }
    }
  }
}
