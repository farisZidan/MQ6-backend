import { TelegramSubscriberEntity } from '../../infrastructure/database/entities/telegram-subscriber.entity';

export const TELEGRAM_SUBSCRIBER_REPOSITORY_PORT =
  'ITelegramSubscriberRepository';

export interface ITelegramSubscriberRepository {
  upsertSubscriber(chatId: string, username?: string): Promise<void>;
  deactivateSubscriber(chatId: string): Promise<void>;
  findAllActive(): Promise<TelegramSubscriberEntity[]>;
}
