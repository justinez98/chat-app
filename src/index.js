const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage,generateLocationMEssage } = require('./utils/messages')
const { addUser, removeUser,getUsersInRoom,getUser } = require('./utils/users')

const app = express()
const server = http.createServer(app)// this is done behind the scene if not stated
const io = socketio(server)//make sure the socket io to work with the server

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public')///serve up the public folder

app.use(express.static(publicDirectoryPath))

//socket is an object that contain information about the new connection(communicate to specific client)
io.on('connection',(socket)=>{
    console.log('New websocket connecttion') // to know of the srver have been conected to socketio

    

    socket.on('join',(options,callback) => {
        const {error, user } = addUser({ id: socket.id, ...options})
        
        if(error){
           return callback(error)
        }

        socket.join(user.room) //emit event to just that room
        socket.emit('message',generateMessage('Admin','Welcome'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined! `))//send to everyone except one person
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })  

    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allow')
        }
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()//run for acknowledgement
    })

    socket.on('sendLocation',(coords,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMEssage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longtitude}`))
        callback()
    })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`)) //build in disconect function
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
       
    })

})


server.listen(port,()=>{
    console.log(`Server is up on port ${port}!`)
})































    // socket.emit('countUpdated',count )//pass the count to the client

    // socket.on('increment',()=>{
    //     count++
    //     // socket.emit('countUpdated',count ) if using socket it will emit to one particular client server
    //     io.emit('countUpdated',count)//io.emit() emit to all server

    // })
