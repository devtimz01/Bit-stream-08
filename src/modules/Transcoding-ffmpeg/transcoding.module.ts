import { Module } from '@nestjs/common';
import { TranscodingService } from './transcoding.service';

@Module({})
export class TranscodingModule {
    exports:[TranscodingService]
}
