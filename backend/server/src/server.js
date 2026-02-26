require('dotenv').config();
const http = require('http');
const app = require('./app');
const prisma = require('./config/prisma');
const { initializeSocket } = require('./socket');
const logger = require('./utils/logger');

// Generate HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io available globally on app
app.set('io', io);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logger.error(`${err.name}: ${err.message}\n${err.stack}`);
    setTimeout(() => {
        process.exit(1);
    }, 500);
});

const port = process.env.PORT || 8000;

const startServer = async () => {
    try {
        console.log('🚀 Starting application...');
        console.log(`- Node version: ${process.version}`);

        console.log('📦 Loading database config...');
        console.log('✅ Database config loaded successfully');

        console.log('🔄 Attempting database connection...');
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        console.log(`🔄 Starting server on port ${port}`);
        server.listen(port, () => {
            console.log(`🚀 Server is running on port ${port}`);
            console.log(`🌐 Server URL: http://localhost:${port}`);
            console.log(`🔌 Socket.IO ready`);
        });

        // Handle unhandled rejections
        process.on('unhandledRejection', (err) => {
            logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
            logger.error(err);

            // Give logger time to write before exiting
            server.close(() => {
                process.exit(1);
            });
        });

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
