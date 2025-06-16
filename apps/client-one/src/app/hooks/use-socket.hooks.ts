import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@org/types';

type SocketClient = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketOptions {
  query: Record<string, string>;
  namespace?: string;
  url?: string;
}

export function useSocket({ query, namespace = '/socket', url }: UseSocketOptions): SocketClient | null {
  const [socket, setSocket] = useState<SocketClient | null>(null);

  useEffect(() => {
    const fullUrl = url ? `${url}${namespace}` : namespace;
    const socketInstance: SocketClient = io(fullUrl, {
      transports: ['websocket'],
      query,
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [namespace, JSON.stringify(query), url]);

  return socket;
}
