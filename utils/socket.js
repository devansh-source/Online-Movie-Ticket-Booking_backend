const socketIo = require('socket.io');

// Initialize Socket.IO with the server
let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.FRONTEND_URL,
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join a room based on showtime ID for real-time seat updates
        socket.on('join-showtime', (showtimeId) => {
            socket.join(showtimeId);
            console.log(`User ${socket.id} joined showtime room: ${showtimeId}`);
        });

        // Leave room on disconnect
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

// Function to emit seat updates to a specific showtime room
const emitSeatUpdate = (showtimeId, updatedSeats) => {
    if (io) {
        io.to(showtimeId).emit('seat-update', updatedSeats);
    }
};

module.exports = { initSocket, emitSeatUpdate };
