import { Module } from '@nestjs/common';
import { SocketBaseGateway } from './gateway/socket-base.gateway';

@Module({
  controllers: [],
  providers: [SocketBaseGateway],
  exports: [],
})
export class SocketBaseModule {}
