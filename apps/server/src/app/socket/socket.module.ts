import { Module } from '@nestjs/common';
import { MissionsSocketGateway } from './socket.gateway';

@Module({
  providers: [MissionsSocketGateway],
  exports: [MissionsSocketGateway], // Optional, only if needed elsewhere
})
export class SocketModule {}

