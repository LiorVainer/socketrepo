import {
  DeviceCommandPayload, DeviceJoinedMissionPayload,
  DeviceStatusUpdatePayload,
  JoinMissionRoomsPayload, SendMissionCommandPayload
} from './socket-events-payload.types';
import {
  DeviceCommandAckPayload,
  DeviceStatusUpdateAckPayload, JoinMissionRoomsAckPayload, SendMissionCommandAckPayload
} from './socket-ack-payloads.types';
import { MissionSocketEvents } from './socket-events-names.types';
import { SocketEventHandler } from '@org/socket';

type ClientRole = 'admin' | 'user' | 'guest';

export interface MissionSocketCTSEventMap {
  [MissionSocketEvents.DEVICE_STATUS_UPDATE]: SocketEventHandler<DeviceStatusUpdatePayload, DeviceStatusUpdateAckPayload>
  [MissionSocketEvents.DEVICE_COMMAND]: SocketEventHandler<DeviceCommandPayload, DeviceCommandAckPayload>
  [MissionSocketEvents.JOIN_MISSION_ROOMS]: SocketEventHandler<
    JoinMissionRoomsPayload,
    JoinMissionRoomsAckPayload
  >;
  [MissionSocketEvents.SEND_MISSION_COMMAND]: SocketEventHandler<SendMissionCommandPayload, SendMissionCommandAckPayload>;
}
export interface MissionSocketSTCEventMap extends MissionSocketCTSEventMap {
  [MissionSocketEvents.DEVICE_JOINED_MISSION]: SocketEventHandler<
    DeviceJoinedMissionPayload,
    void
  >;
}


export type ClientToServerEvents = MissionSocketCTSEventMap;
export type ServerToClientEvents = MissionSocketSTCEventMap;

export type ControllerSocketHandshakeQuery =
  | { clientType: 'role'; role: ClientRole };

export type DeviceSocketHandshakeQuery =
  | { clientType: 'device'; deviceId: string };

export type MissionSocketHandshakeQuery = ControllerSocketHandshakeQuery | DeviceSocketHandshakeQuery;
