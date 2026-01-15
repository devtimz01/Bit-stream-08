import { Module } from '@nestjs/common';
import { TranscodingService } from '../Transcoding-ffmpeg/transcoding.service';

@Module({})
export class WebTrcModule {
    import:[TranscodingService]
}
