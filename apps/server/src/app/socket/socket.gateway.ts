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
  private deviceMissionsMap = new Map<string, Set<string>>();

  @SubscribeMessage(MissionSocketEvents.DEVICE_COMMAND)
  async handleDeviceCommand(
    @MessageBody() rawPayload: unknown,
    @ConnectedSocket() client: MissionsSocket
  ): Promise<Ack<DeviceCommandAckPayload>> {
    const result = DeviceCommandSchema.safeParse(rawPayload);
    if (!result.success) {
      return ackError(result.error.flatten().formErrors.join('; '));
    }

    const { missionId, deviceId, command, from } = result.data;

    const missionRoom = this.getMissionRoom(missionId);

    // Verify the device is in the mission room first (optional but good practice)
    const socketsInMissionRoom = await this.server
      .in(missionRoom)
      .fetchSockets();

    const isDeviceInMissionRoom = socketsInMissionRoom.some(
      (s) => s.data.clientType === 'device' && s.data.deviceId === deviceId
    );

    if (!isDeviceInMissionRoom) {
      return ackError(`Device ${deviceId} not found in mission ${missionId}`);
    }

    // Send event to the device's personal room (which is named after its deviceId)
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

      if (isDeviceSocket(client)) {
        if (!this.deviceMissionsMap.has(client.data.deviceId)) {
          this.deviceMissionsMap.set(client.data.deviceId, new Set());
        }

        this.deviceMissionsMap.get(client.data.deviceId)?.add(missionId);
      }
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
      client.join(deviceId);
      console.log(
        `[Device] ${deviceId} connected, joined personal room ${deviceId}`
      );
    } else {
      client.data = { clientType: 'role', role: 'admin' };
      console.log(`[Controller] ${client.id} connected`);
    }
  }

  override handleDisconnect(client: MissionsSocket) {
    // If the disconnected client was a device
    if (isDeviceSocket(client) && client.data.deviceId) {
      const deviceId = client.data.deviceId;
      const missionsOfDevice = this.deviceMissionsMap.get(deviceId);

      if (missionsOfDevice) {
        for (const missionId of missionsOfDevice) {
          const room = this.getMissionRoom(missionId);
          // Emit to the specific mission room that this device disconnected
          this.server.to(room).emit(MissionSocketEvents.DEVICE_LEFT_MISSION, {
            missionId,
            deviceId,
          });
          console.log(
            `Device ${deviceId} disconnected from mission ${missionId}. Notifying room ${room}.`
          );
        }
        // Clean up the mapping for the disconnected device
        this.deviceMissionsMap.delete(deviceId);
      }
    }

    console.log(`Client ${client.id} disconnected:`, client.data);
  }
}
