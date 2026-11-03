// src/presentation/mqtt/telemetry.consumer.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { MqttClientService } from '../../infrastructure/mqtt/mqtt-client.service';
import { IngestTelemetryUseCase } from '../../application/use-cases/ingest-telemetry.use-case';

@Injectable()
export class TelemetryConsumer implements OnModuleInit {
  constructor(
    private readonly mqttClientService: MqttClientService,
    private readonly ingestTelemetryUseCase: IngestTelemetryUseCase,
  ) {}

  onModuleInit() {
    this.mqttClientService.subscribe(
      'gas-monitor/+/telemetry',
      async (topic, payload) => {
        try {
          console.log('[RANJAU 1 - CONSUMER] Raw Topic:', topic);
          console.log('[RANJAU 1 - CONSUMER] Raw Payload:', payload.toString());
          const rawJson = JSON.parse(payload.toString());
          await this.ingestTelemetryUseCase.execute(rawJson);
        } catch (err) {
          console.error('[RANJAU 1 - CONSUMER] Error processing telemetry:', err);
          // Payload JSON corrupt ditangani di sini
        }
      },
    );
  }
}
