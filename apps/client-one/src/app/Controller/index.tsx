import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/use-socket.hooks';

export const Controller = () => {
  const [log, setLog] = useState<string[]>([]);
  const [command, setCommand] = useState('');
  const socket = useSocket({
    query: { role: 'controller' },
    url: 'http://localhost:3000',
  });

  const sendCommand = () => {
    socket?.emit('send-to-device', { deviceId: 'device-1', command }, (res) => {
      const message = 'ACK: ' + JSON.stringify(res);
      console.log(message);
      setLog((prev) => [...prev, message]);
    });
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('device-command', (data) => {
      const msg = `From ${data.from}: ${data.command} → ${data.result}`;
      console.log(msg);
      setLog((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('device-command');
    };
  }, [socket]);

  return (
    <div>
      <h2>🎮 Controller</h2>
      <input
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="Enter command"
      />
      <button onClick={sendCommand}>Send</button>
      <ul>
        {log.map((entry, i) => (
          <li key={i}>{entry}</li>
        ))}
      </ul>
    </div>
  );
};
