const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:3000', // Frontend
        'http://localhost:3001', // Dashboard
        process.env.FRONTEND_URL,
        process.env.DASHBOARD_URL,
      ].filter(Boolean),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const secret =
        process.env.JWT_ACCESS_SECRET ||
        process.env.JWT_ACCESS_KEY ||
        'FHDJKFHDJKSHFJKFHJKDSHF';
      const decoded = jwt.verify(token, secret);

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
        },
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        console.warn(`Socket auth failed: Token expired for a user at ${error.expiredAt}`);
      } else {
        console.error('Socket auth error:', error);
      }
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', async (socket) => {
    console.log('✅ User connected:', socket.user.email);

    // Update user online status
    await prisma.user.update({
      where: { id: socket.userId },
      data: {
        isOnline: true,
        socketId: socket.id,
        lastSeen: new Date(),
      },
    });

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Join role-based room
    socket.join(`role:${socket.user.role}`);

    // Broadcast online status
    socket.broadcast.emit('user:online', {
      userId: socket.userId,
      user: socket.user,
    });

    // Load handlers
    require('./handlers/notificationHandler')(io, socket);
    require('./handlers/chatHandler')(io, socket);
    require('./handlers/orderHandler')(io, socket);

    // Disconnect handler
    socket.on('disconnect', async () => {
      console.log('❌ User disconnected:', socket.user.email);

      try {
        // Only update offline status if no other sockets for this user
        const sockets = await io.in(`user:${socket.userId}`).fetchSockets();
        if (sockets.length === 0) {
          // Update offline status
          await prisma.user.update({
            where: { id: socket.userId },
            data: {
              isOnline: false,
              socketId: null,
              lastSeen: new Date(),
            },
          });

          // Broadcast offline status
          socket.broadcast.emit('user:offline', {
            userId: socket.userId,
          });
        }
      } catch (error) {
        console.error('Error handling disconnect for user:', socket.user.email, error);
      }
    });
  });

  console.log('🔌 Socket.IO initialized');
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

module.exports = { initializeSocket, getIO };
