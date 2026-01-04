import { Module } from '@nestjs/common';
import { LiveStreamController } from './live-stream.controller';

@Module({
  controllers: [LiveStreamController]
})
export class LiveStreamModule {}
