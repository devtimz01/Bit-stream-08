import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebTrcModule } from './modules/webTrc-signaling/web-trc.module';

@Module({
  imports: [WebTrcModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
