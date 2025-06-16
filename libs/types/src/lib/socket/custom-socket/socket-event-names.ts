import { ValueOf } from '../../general';

export const SocketEvents = {
  DEVICE_COMMAND: 'device-command',
  DEVICE_STATUS_UPDATE: 'device-status-update',
  PING: 'ping',
} as const;

export type SocketEvent = ValueOf<typeof SocketEvents>;
