const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 8000;
const API_URL = `http://localhost:${PORT}/api`;
const JWT_SECRET = process.env.JWT_ACCESS_KEY || process.env.JWT_ACCESS_SECRET;

async function runTest() {
  console.log('Starting User List Verification...');

  // Create Test Admin
  const adminEmail = 'temp_admin_list_test@example.com';

  try {
    // Upsert admin
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'ADMIN', status: 'ACTIVE' },
      create: {
        email: adminEmail,
        username: 'temp_admin_list',
        firstName: 'Temp',
        lastName: 'Admin',
        password: 'password123',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    console.log('Test admin created.');

    // Generate Token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    // Test GET /user
    console.log('\nrequesting GET /user ...');
    try {
      const res = await axios.get(`${API_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('✅ PASS: Got user list');
      console.log('Count:', res.data.data.length);
      console.log('Stats:', res.data.meta.stats);
    } catch (e) {
      console.log('❌ FAIL: Get user list failed', e.response?.status, e.response?.data?.message);
      if (e.response?.data) console.log(e.response.data);
    }
  } catch (error) {
    console.error('Test Setup Error:', error);
  } finally {
    console.log('\nCleaning up...');
    try {
      await prisma.user.delete({ where: { email: adminEmail } });
      console.log('Cleanup done.');
    } catch (cleanupError) {
      console.log('Cleanup failed (maybe user not created):', cleanupError.message);
    }
    await prisma.$disconnect();
  }
}

runTest();
