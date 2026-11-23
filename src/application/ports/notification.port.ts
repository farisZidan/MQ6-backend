// src/application/ports/notification.port.ts
export const NOTIFICATION_PORT = 'INotificationPort';

export interface INotificationPort {
  sendAlert(message: string): Promise<void>; // Broadcast ke semua pelanggan
  sendDirectMessage(chatId: string, message: string): Promise<void>; // Balas ke 1 orang
}
