import io from 'socket.io-client'

const socket = io('http://localhost:3000')
        socket.on('connect',()=>{
            console.log('connection set')
        })
        socket.emit('stream-offer',{
            userId: 'test',
            offer:{ type: 'offer', sdp: 'v=0\no=test...' }
        });

        socket.on('stream-offer',(response)=>{
            console.log('client connected', response)
        })

        socket.on('errors',(error)=>{
            console.log(error)
        })