import type { TypedSocket } from '@org/socket';
import {
  ClientToServerEvents,
  ControllerSocketHandshakeQuery,
  DeviceSocketHandshakeQuery,
  MissionSocketHandshakeQuery,
  ServerToClientEvents,
} from '../types/socket';

export type MissionsSocket = TypedSocket<
  ClientToServerEvents,
  ServerToClientEvents,
  MissionSocketHandshakeQuery
>;
export type DeviceSocket = TypedSocket<
  ClientToServerEvents,
  ServerToClientEvents,
  DeviceSocketHandshakeQuery
>;
export type ControllerSocket = TypedSocket<
  ClientToServerEvents,
  ServerToClientEvents,
  ControllerSocketHandshakeQuery
>;
