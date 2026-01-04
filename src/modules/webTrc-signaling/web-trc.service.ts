import { Injectable } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionStream } from './session-stream-interface';

@WebSocketGateway({cors:true})
export class WebTrcSignalingGateway {
    @WebSocketServer()
    server:Server
    private sessionStream = new Map<string,SessionStream>();
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
        
        pc.ontrack=(event)=>{
            const stream=event.streams[0]
            console.log('stream found',stream)
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
