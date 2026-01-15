import { Injectable } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionStream } from './session-stream-interface';
import { TranscodingService } from '../Transcoding-ffmpeg/transcoding.service';

@WebSocketGateway({cors:true})
export class WebTrcSignalingGateway {
    @WebSocketServer()
    server:Server
    private sessionStream = new Map<string,SessionStream>();
    constructor(private transcodingService:TranscodingService){
        
    }

    @SubscribeMessage('stream-offer')
    async handleStartStream(@MessageBody() data:{userId:string ,offer:RTCSessionDescriptionInit},@ConnectedSocket() client:Socket){
        const sessionId= `stream_${data.userId}_${Date.now()}`
        const Session:SessionStream= {
            id:sessionId,
            userId: data.userId,
            clientId: client.id,
            client,
            status:'starting',
            viewCount:0,
            createdAt: new Date()
        }
        this.sessionStream.set(sessionId,Session)
        const iceServers=[
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
        ]
        return{
            sessionId,
            iceServers,
            ingestedWsUrl:`ws://localhost:3000/ingest/${sessionId}`
        }
    }
    @SubscribeMessage('offer-stream')
    async handleStreamOffer(@MessageBody() data:{sessionId: string,offer: RTCSessionDescriptionInit}){
        const session = this.sessionStream.get(data.sessionId)
        if(!session){
            throw new Error('session not found')
        }
        const {client} = session
        const pc = new RTCPeerConnection(
            {iceServers:[{ urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }]})
                                        
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        
        const outputstream = new MediaStream()
        pc.ontrack=async(event)=>{
            outputstream.addTrack(event.track)
            console.log('track recieved',event.track.kind)
            if(outputstream.getTracks().length>=2){
                 const hlsUrl = await this.transcodingService.startTranscoding(data.sessionId,outputstream)
                 if(!hlsUrl){
                    throw new Error('hlsUrl outputstream,transcoding error')
                 }
                 session.hlsUrl= hlsUrl as string
                 session.status= 'live'
                 client.emit('hls-output',{hlsUrl})
            }
        }

        //my datachannel setup to receive video chunks added to browser...
        const dataChannel = pc.createDataChannel('video')
        dataChannel.binaryType= 'arraybuffer'

        dataChannel.onopen=()=>{
            console.log('dataChannel opened')
        }
        dataChannel.onmessage=(event)=>{
           const chunk = Buffer.from(event.data)
            this.transcodingService.writeChunk(data.sessionId,chunk)
        }

        pc.onicecandidate=(event)=>{
            if(event.candidate){
                client.emit('ice-candidate',event.candidate)
            }
        }
        
        session.pc= pc //i put this pc setup here for  later cleanup.
        return {answer}
    }
};
