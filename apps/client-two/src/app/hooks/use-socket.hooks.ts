import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@org/types';

type SocketClient = Socket<ServerToClientEvents, ClientToServerEvents>;

interface UseSocketOptions {
  query: Record<string, string>;
  namespace?: string;
  url?: string;
}

export function useSocket({ query, namespace = '/socket', url }: UseSocketOptions) {
  const socketRef = useRef<SocketClient | undefined>(undefined);

  useEffect(() => {
    const socket: SocketClient = io(url ? `${url}${namespace}` : namespace, {
      transports: ['websocket'],
      query,
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [namespace, JSON.stringify(query), url]);

  return socketRef.current;
}
