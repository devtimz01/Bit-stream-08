import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LiveStreamModule } from './modules/live-stream/live-stream.module';

@Module({
  imports: [LiveStreamModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
