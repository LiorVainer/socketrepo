import { Socket } from 'socket.io';
import type { Ack } from '../helpers/ack.utils';
import { z } from 'zod';

export type SocketData = Record<string, unknown>; // can override

export type TypedSocket<
  CTS extends Record<string, any> = Record<string, any>,
  STC extends Record<string, any> = Record<string, any>,
  D extends SocketData = SocketData
> = Socket<CTS, STC, Record<string, any>, D>;


export type SocketEventHandler<EventPayload = any, AckPayload = any> = (
  payload: EventPayload,
  ack?: (ack: Ack<AckPayload>) => void
) => void;

export const PingAckPayloadSchema = z.object({
  pong: z.string(),
});

export type PingAckPayload = z.infer<typeof PingAckPayloadSchema>;

export const PingSchema = z.string().min(1);
export type PingPayload = z.infer<typeof PingSchema>;
