import { useEffect } from 'react';
import { useSocket } from '@org/socket-client';

export const Device = () => {
  const socket = useSocket({ query: { deviceId: 'device-1'} , url: 'http://localhost:3000'});

  useEffect(() => {
    socket?.on('device-command', (data) => {
      console.log('Received command:', data);
    });
  }, [socket]);

  return <h2>Device Online</h2>;
};
