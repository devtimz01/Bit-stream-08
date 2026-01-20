import io from 'socket.io-client'
import {v4 as uuidv4} from 'uuid'

export const WebRTCConfig=async()=>{
    const livestream =await navigator.mediaDevices.getUserMedia({video:true, audio:true})
    
    const socket = io('http://localhost:3000')
    socket.on('connect',()=>{
        console.log('io active')
    })

    socket.emit('stream-offer',{
        userId: uuidv4()
    })
    
    const pc = new RTCPeerConnection({iceServers:[
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
        ]});

        livestream.getTracks().forEach(track=> pc.addTrack(track,livestream))

    socket.on('offer-stream', async (data) => {
    console.log('Received answer from server');
    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));});

    const setOffer =await pc.createOffer()
    await pc.setLocalDescription(setOffer)

     socket.on('stream-offer',(response)=>{
        const sessionId= response.sessionId
    socket.emit('offer-stream',{
        sessionId: sessionId,
        offer:pc.localDescription
    })});

    socket.on('ice-candidate', (candidate) => {
    pc.addIceCandidate(new RTCIceCandidate(candidate));
});

pc.oniceconnectionstatechange = () => {
  console.log('ICE state:', pc.iceConnectionState);
  if (pc.iceConnectionState === 'connected') {
    console.log('WebRTC Connected to my nest serever!');
  }
};
};
