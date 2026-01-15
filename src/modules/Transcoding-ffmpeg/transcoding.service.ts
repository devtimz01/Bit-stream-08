import { Injectable, OnModuleDestroy} from '@nestjs/common';
import { ChildProcess, spawn } from 'child_process';
import { join } from 'path';
import EventEmitter from 'events';
import { mkdir,rm } from 'fs/promises';

@Injectable()
export class TranscodingService extends EventEmitter implements OnModuleDestroy{
   private processes = new Map<string,ChildProcess>()
   private readonly hlsOutputDir = join(process.cwd(),'hls')
  async startTranscoding(sessionId: string, inputStream: MediaStream):Promise<string>{
    const outputDir = join(this.hlsOutputDir,sessionId)
     await mkdir(outputDir,{recursive:true})
     const ffmpeg = spawn('ffmpeg',[
        //NB: right here is my input flag
        '-re', // Real-time input
        '-i', 'pipe:0', // Read from stdin
        '-f', 'webm', // Input format

        //video encoding 
        '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-tune', 'zerolatency',
      '-b:v', '2000k',
      '-maxrate', '2000k',
      '-bufsize', '4000k',
      '-g', '50', // Keyframe interval
      '-r', '30', // Frame rate
      '-s', '1280x720', // Resolution

      //audio encoding
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      '-ac', '2',

      //my hls setting
       '-f', 'hls',
      '-hls_time', '4', // Segment length
      '-hls_list_size', '6', // Max segments in playlist
      '-hls_flags', 'delete_segments+append_list',
      '-hls_segment_filename', join(outputDir,'segment_%03d.ts'),
      
      //output
      join(outputDir,'manisfest.m3u8')

     ],{
        stdio:['pipe','ignore','pipe']
     })
     ffmpeg.stderr.on('data',(data)=>{
        console.log(`ffmpeg [${sessionId}]:${data.toString()}`)
     })
     ffmpeg.on('exit',(code)=>{
        console.log(`process exit with code ${code}`)
        this.processes.delete(sessionId)
        this.emit('transcoding-ending',sessionId)
     })
     this.processes.set(sessionId,ffmpeg)
     return `/hls/${sessionId}/manifest.m3u8` ;
   };

   writeChunk(sessionId: string, chunk: Buffer){
    const process = this.processes.get(sessionId)
    if(process&&!process.stdin?.destroyed){
         process.stdin?.write(chunk)
    }
   };

   stopTranscoding(sessionId: string){
      const process =this.processes.get(sessionId)
      if(process){
        process.kill('SIGTERM')
        this.processes.delete(sessionId)
      }
      setTimeout(async()=>{
        try{
            await rm(join(this.hlsOutputDir,sessionId), {recursive: true, force:true})
        }
        catch(err){
            console.log(`failed to cleanup ${sessionId}`)
        }
      },5000)
   }
   onModuleDestroy() {
     for (const [sessionId,process] of this.processes.entries()){
        process.kill('SIGTERM')
        console.log(`ffmpeg killed ${sessionId}`)
     }
   }
} 
