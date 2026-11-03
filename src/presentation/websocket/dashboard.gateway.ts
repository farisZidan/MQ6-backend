// src/presentation/websocket/dashboard.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/dashboard' })
export class DashboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(DashboardGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`[WS] Client terhubung: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[WS] Client terputus: ${client.id}`);
  }

  sendSensorUpdate(data: any) {
    this.server.emit('sensor:update', data);
  }

  sendNewEvent(eventData: any) {
    this.server.emit('event:new', eventData);
  }

  sendDeviceStatusUpdate(statusData: any) {
    this.server.emit('device:status', statusData);
  }
}
