const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const crypto = require('crypto'); // For generating unique room IDs
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files from the 'public' directory
app.use(express.static('static'));


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/static/index.html'); // __dirname : abs path of dir of this index.js
});


let rooms = {}; // Store rooms, their passcodes, and messages

// Handle client connections
io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // Join a room with a username
    socket.on('joinRoom', ({ username, roomID, /*passcode */ }) => {
        if (!rooms[roomID]) {
            socket.emit('error', 'Room does not exist');
            return;
        }
        /*
        if (rooms[roomID].passcode !== passcode) {
            socket.emit('error', 'Invalid passcode');
            return;
        } */

        const timestamp = new Date().toLocaleTimeString(); // Get the current time
        socket.join(roomID); // Join the room
        socket.username = username; // Save the username
        socket.roomID = roomID;

        // Send previous chat history to the new user
        socket.emit('chatHistory', rooms[roomID].messages);


        const msgObj = { username: 'System', message: `${username} has joined the chat`, timestamp };
        //console.log(msgObj)
        rooms[roomID].messages.push(msgObj); // Save message to chat history

        // Notify others in the room
        io.to(roomID).emit('chatMessage', msgObj);
    });

    // Handle message sending in the room
    socket.on('chatMessage', (message) => {
        const timestamp = new Date().toLocaleTimeString(); // Get the current time
        //console.log('time : ', timestamp)
        const roomID = socket.roomID;
        if (!roomID) return;

        const msgObj = { username: socket.username, message, timestamp };
        //console.log(msgObj)
        rooms[roomID].messages.push(msgObj); // Save message to chat history

        // Broadcast the message to everyone in the room
        io.to(roomID).emit('chatMessage', msgObj);
    });

    // Create a new room with a passcode
    socket.on('createRoom', (callback) => {
        const roomID = crypto.randomBytes(4).toString('hex'); // Generate a unique room ID
        const passcode = crypto.randomBytes(3).toString('hex'); // Generate a unique passcode
        rooms[roomID] = { passcode, messages: [] }; // Initialize room

        // Send the room ID and passcode back to the creator
        callback({ roomID, passcode });
    });


    socket.on('deleteRoom', (roomID) => {
        if (rooms[roomID]) {
            delete rooms[roomID];
            io.to(roomID).emit('roomDeleted', roomID); // Notify clients that the room was deleted
        }
    });
    

    // Handle disconnects
    socket.on('disconnect', () => {
        const roomID = socket.roomID;
        const timestamp = new Date().toLocaleTimeString(); // Get the current time
        if (roomID) {
            const msgObj = { username: 'System', message: `${socket.username} has left the chat`, timestamp };
            //console.log(msgObj)
            rooms[roomID].messages.push(msgObj); // Save message to chat history

            io.to(roomID).emit('chatMessage', msgObj);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
