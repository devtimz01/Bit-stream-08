import { Controller,Get, HttpCode, HttpStatus, InternalServerErrorException, NotFoundException, Param, Res } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import type{ Response } from 'express';

@Controller('hls')
export class LiveStreamController {
    private readonly outDir = join(process.cwd(),'hls')
    @Get('/:sessionId/manifest.m3u8')
    @HttpCode(HttpStatus.OK)
    serverManifest(@Param('sessionId') sessionId:string, @Res() res:Response){
        try{
            const manifestPath =join(this.outDir,sessionId)
            if(!existsSync(manifestPath)){
                throw new NotFoundException()
            }
            res.header('content-type','application/vnd.apple.mpegurl')
            res.header('cache-control','no-cache')
            return res.sendFile(manifestPath)
        }
        catch(e){
            console.log(e)
            throw new InternalServerErrorException
        }
    }
    @Get('/:sessionId/:segment')
    @HttpCode(HttpStatus.OK)
    serveSegment(@Param('sessionId') sessionId:string, @Param('segment') segment:string, @Res() res:Response){
        try{
            const segmentPath =join(this.outDir,sessionId,segment)
            if(!existsSync(segmentPath)){
                throw new NotFoundException()
            }
            res.header('content-type','video/MP2T')
            res.header('cache-control','public, max-age=31536000')
            return res.sendFile(segmentPath)
        }
        catch(e){
            console.log(e)
            throw new InternalServerErrorException
        }
    } 
};