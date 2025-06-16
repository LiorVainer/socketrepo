import { ControllerSocket, DeviceSocket, MissionsSocket } from './socket.types';

export const isDeviceSocket = (
  socket: MissionsSocket
): socket is DeviceSocket => {
  return socket?.data.clientType === 'device';
};

export const isControllerSocket = (
  socket: MissionsSocket
): socket is ControllerSocket => {
  return socket?.data.clientType === 'role';
};
