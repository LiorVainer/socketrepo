import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { PingAckPayload, PingSchema, TypedSocket } from '../types';
import { type Ack, ackError, ackSuccess } from '../helpers/ack.utils';

@WebSocketGateway({ namespace: '/socket', cors: { origin: '*' } })
export class SocketBaseGateway<
  CTS extends Record<string, any>,
  STC extends Record<string, any>,
  D extends Record<string, any>
> {
  @WebSocketServer()
  protected server!: Server<CTS, STC, Record<string, any>, D>;

  handleConnection(client: TypedSocket<CTS, STC, D>) {
    console.log(`[Socket] Client connected: ${client.id}`);
  }

  handleDisconnect(client: TypedSocket<CTS, STC, D>) {
    console.log(`[Socket] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() rawPayload: unknown): Ack<PingAckPayload> {
    const result = PingSchema.safeParse(rawPayload);
    if (!result.success) {
      return ackError('Invalid ping payload');
    }

    return ackSuccess({ pong: result.data });
  }
}
