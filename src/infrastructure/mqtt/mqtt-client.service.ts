import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttClientService.name);
  private client: mqtt.MqttClient;

  onModuleInit() {
    const brokerUrl =
      process.env.MQTT_BROKER_URL || 'mqtt://192.168.18.202:1883';

    const options: mqtt.IClientOptions = {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clientId: `nest_backend_${Math.random().toString(16).substring(2, 8)}`,
      clean: true,
      reconnectPeriod: 3000,
      connectTimeout: 5000,
    };

    this.logger.log(
      `[MQTT] Mencoba menghubungkan ke ${brokerUrl} dengan user [${options.username}]...`,
    );
    this.client = mqtt.connect(brokerUrl, options);

    // 1. Berhasil terhubung total (TCP + Auth diterima broker)
    this.client.on('connect', (connack) => {
      this.logger.log(
        `[MQTT] KONEKSI BERHASIL! Terhubung ke broker MQTT. Session Present: ${connack.sessionPresent}`,
      );
    });

    // 2. Menangkap error tingkat rendah (seperti ECONNREFUSED atau Auth ditolak)
    this.client.on('error', (err: any) => {
      this.logger.error(
        `[MQTT] Event Error: ${err.message} | Kode Sistem: ${err.code || 'UNKNOWN'}`,
      );
      if (err.code === 'ECONNREFUSED') {
        this.logger.error(
          `[MQTT] DIAGNOSIS: Port 1883 tertutup atau kontainer MQTT di server mati.`,
        );
      }
    });

    // 3. Klien masuk ke status offline
    this.client.on('offline', () => {
      this.logger.warn(`[MQTT] Klien berstatus OFFLINE.`);
    });

    // 4. Koneksi TCP ditutup
    this.client.on('close', () => {
      this.logger.warn(`[MQTT] Koneksi TCP ke broker ditutup.`);
    });

    // 5. Proses reconnect otomatis
    this.client.on('reconnect', () => {
      this.logger.warn(
        `[MQTT] Sedang mencoba melakukan penyambungan ulang (reconnect)...`,
      );
    });
  }

  subscribe(topic: string, callback: (topic: string, payload: Buffer) => void) {
    this.client.subscribe(topic, { qos: 1 }, (err) => {
      if (!err) {
        this.logger.log(`[MQTT] Berhasil subscribe ke topic: ${topic}`);
      } else {
        this.logger.error(`[MQTT] Gagal subscribe: ${err.message}`);
      }
    });

    this.client.on('message', callback);
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.end();
    }
  }
}
