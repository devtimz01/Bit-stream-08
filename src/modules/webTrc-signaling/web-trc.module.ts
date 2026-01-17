import { Module } from '@nestjs/common';
import { WebTrcSignalingGateway } from './web-trc.service';
import { TranscodingModule } from '../Transcoding-ffmpeg/transcoding.module';

@Module({
    imports:[TranscodingModule],
    exports:[WebTrcSignalingGateway],
    providers:[WebTrcSignalingGateway]
})

export class WebTrcModule {}
