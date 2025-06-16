import { Injectable } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Ack, ackError, ackSuccess, SocketBaseGateway } from '@org/socket';
import {
  ClientToServerEvents,
  DeviceCommandAckPayload,
  DeviceCommandSchema,
  DeviceSocketHandshakeQuery,
  DeviceStatusUpdateAckPayload,
  DeviceStatusUpdateSchema,
  JoinMissionRoomsAckPayload,
  JoinMissionRoomsSchema,
  MissionSocketEvents,
  MissionSocketHandshakeQuery,
  SendMissionCommandAckPayload,
  SendMissionCommandSchema,
  ServerToClientEvents,
} from '../types/socket';
import { RemoteSocket } from 'socket.io';
import { isDeviceSocket } from './socket.utils';
import { MissionsSocket } from './socket.types';

@Injectable()
export class MissionsSocketGateway extends SocketBaseGateway<
  ClientToServerEvents,
  ServerToClientEvents,
  MissionSocketHandshakeQuery
> {
  @SubscribeMessage(MissionSocketEvents.DEVICE_COMMAND)
  async handleDeviceCommand(
    @MessageBody() rawPayload: unknown,
    @ConnectedSocket()
    client: MissionsSocket
  ): Promise<Ack<DeviceCommandAckPayload>> {
    const result = DeviceCommandSchema.safeParse(rawPayload);
    if (!result.success) {
      return ackError(result.error.flatten().formErrors.join('; '));
    }

    const { missionId, deviceId, command, from } = result.data;

    const room = this.getMissionRoom(missionId);
    const deviceSocket = this.server.sockets.adapter.rooms
      .get(room)
      ?.has(deviceId);

    if (!deviceSocket) {
      return ackError(`Device ${deviceId} not found in mission ${missionId}`);
    }

    // Send event to device
    this.server.to(deviceId).emit(MissionSocketEvents.DEVICE_COMMAND, {
      missionId,
      deviceId,
      command,
      from: from ?? 'controller',
    });

    return ackSuccess({ deliveredTo: deviceId });
  }

  @SubscribeMessage(MissionSocketEvents.DEVICE_STATUS_UPDATE)
  async handleDeviceStatusUpdate(
    @MessageBody() rawPayload: unknown,
    @ConnectedSocket()
    client: MissionsSocket
  ): Promise<Ack<DeviceStatusUpdateAckPayload>> {
    const result = DeviceStatusUpdateSchema.safeParse(rawPayload);
    if (!result.success) {
      return ackError(result.error.flatten().formErrors.join('; '));
    }

    const payload = result.data;

    // Broadcast to all controllers in that mission room
    const room = this.getMissionRoom(payload.missionId);
    this.server
      .to(room)
      .emit(MissionSocketEvents.DEVICE_STATUS_UPDATE, payload);

    return ackSuccess({ received: true });
  }

  private getMissionRoom(missionId: string) {
    return `mission:${missionId}`;
  }

  @SubscribeMessage(MissionSocketEvents.JOIN_MISSION_ROOMS)
  async joinMissionRooms(
    @ConnectedSocket() client: MissionsSocket,
    @MessageBody() rawPayload: unknown
  ): Promise<Ack<JoinMissionRoomsAckPayload>> {
    const result = JoinMissionRoomsSchema.safeParse(rawPayload);

    if (!result.success) {
      return ackError('Invalid mission join payload');
    }

    const { missions } = result.data;
    const joined: string[] = [];
    const devices: Record<string, string[]> = {};

    for (const missionId of missions) {
      const room = this.getMissionRoom(missionId);
      await client.join(room);
      joined.push(missionId);

      // Get all sockets in the mission room
      const socketsInRoom = await this.server.in(room).fetchSockets();

      // Filter only device clients in that room
      const deviceIds = socketsInRoom
        .filter(
          (
            s
          ): s is RemoteSocket<
            ServerToClientEvents,
            DeviceSocketHandshakeQuery
          > => s.data.clientType === 'device'
        )
        .map((s) => s.data.deviceId)
        .filter(Boolean);

      devices[missionId] = deviceIds;

      if (isDeviceSocket(client)) {
        console.log(
          `Device ${client.data.deviceId} joined mission ${missionId}`
        );

        this.server.to(room).emit(MissionSocketEvents.DEVICE_JOINED_MISSION, {
          missionId,
          deviceId: client.data.deviceId,
        });
      }
    }

    return ackSuccess({ joined, devices });
  }

  @SubscribeMessage(MissionSocketEvents.SEND_MISSION_COMMAND)
  handleSendMissionCommand(
    @MessageBody() rawPayload: unknown,
    @ConnectedSocket() client: MissionsSocket
  ): Ack<SendMissionCommandAckPayload> {
    const result = SendMissionCommandSchema.safeParse(rawPayload);
    if (!result.success) {
      return ackError(result.error.flatten().formErrors.join('; '));
    }

    const { missionId, command, from } = result.data;
    const room = this.getMissionRoom(missionId);

    this.server.to(room).emit(MissionSocketEvents.SEND_MISSION_COMMAND, {
      missionId,
      command,
      from: from ?? 'controller',
    });

    return ackSuccess({ deliveredTo: `room:${missionId}` });
  }

  override handleConnection(client: MissionsSocket) {
    const query = client.handshake.query;
    const deviceId = typeof query.deviceId === 'string' ? query.deviceId : null;

    if (deviceId) {
      client.data = { clientType: 'device', deviceId };
      console.log(`[Device] ${deviceId} connected`);
    } else {
      client.data = { clientType: 'role', role: 'admin' };
      console.log(`[Controller] ${client.id} connected`);
    }
  }

  override handleDisconnect(client: MissionsSocket) {
    console.log(`Client ${client.id} disconnected:`, client.data);
  }
}
