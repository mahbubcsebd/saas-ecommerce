console.log('STARTING DIAGNOSTIC');
try {
  console.log('1. Loading dotenv');
  require('dotenv').config();
  console.log('2. Loading http');
  const http = require('http');
  console.log('3. Loading prisma');
  const prisma = require('./config/prisma');
  console.log('4. Loading app');
  const app = require('./app');
  console.log('5. Loading socket');
  const { initializeSocket } = require('./socket');
  console.log('SUCCESS');
} catch (e) {
  console.log('--- ERROR START ---');
  console.log('Name:', e.name);
  console.log('Message:', e.message);
  console.log('Stack:', e.stack);
  console.log('--- ERROR END ---');
}
