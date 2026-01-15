import { Socket } from "socket.io"

export interface SessionStream{
    id:string,
    userId: string,
    clientId: string,
    client: Socket,
    pc?:RTCPeerConnection,
    hlsUrl?: string;
    status:'starting'|'live'|'ended',
    viewCount:number,
    createdAt: Date
}