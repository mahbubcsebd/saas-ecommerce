const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 8000;
const API_URL = `http://localhost:${PORT}/api`;
const JWT_SECRET = process.env.JWT_ACCESS_KEY || process.env.JWT_ACCESS_SECRET;

async function runTest() {
  console.log('Starting User Create/Update Verification...');

  // Create Test Admin for auth
  const adminEmail = 'temp_admin_cud_test@example.com';
  let adminUserId;

  try {
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'ADMIN', status: 'ACTIVE' },
      create: {
        email: adminEmail,
        username: 'temp_admin_cud',
        firstName: 'Temp',
        lastName: 'Admin',
        password: 'password123',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    adminUserId = user.id;
    console.log('Test admin created.');

    // Generate Token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    const authHeader = { Authorization: `Bearer ${token}` };

    // 1. Create User via Admin API
    console.log('\nTest 1: Creating new user (POST /admin/users)...');
    const newUserPayload = {
      firstName: 'New',
      lastName: 'User',
      email: 'new_created_user@example.com',
      username: 'new_created_user',
      role: 'STAFF',
      phone: '1234567890',
    };

    let createdUserId;
    try {
      const res = await axios.post(`${API_URL}/admin/users`, newUserPayload, {
        headers: authHeader,
      });
      console.log('✅ PASS: User created');
      createdUserId = res.data.data.id; // Adjust based on actual response structure
    } catch (e) {
      console.log('❌ FAIL: Create user failed', e.response?.status, e.response?.data);
      throw e;
    }

    // 2. Fetch User (Simulate editing page load)
    console.log(`\nTest 2: Fetching user ${createdUserId} (GET /user/:id)...`);
    try {
      const res = await axios.get(`${API_URL}/user/${createdUserId}`, { headers: authHeader });
      console.log('✅ PASS: User fetched');
      if (res.data.data.role !== 'STAFF')
        console.log('⚠️ WARNING: Role mismatch', res.data.data.role);
    } catch (e) {
      console.log('❌ FAIL: Fetch user failed', e.response?.status);
    }

    // 3. Update User
    console.log(`\nTest 3: Updating user ${createdUserId} (PATCH /user/:id)...`);
    const updatePayload = {
      firstName: 'Updated Name',
      role: 'MANAGER',
    };
    try {
      const res = await axios.patch(`${API_URL}/user/${createdUserId}`, updatePayload, {
        headers: authHeader,
      });
      console.log('✅ PASS: User updated');
      if (res.data.data.firstName !== 'Updated Name') console.log('❌ FAIL: Name not updated');
      // Note: Updating role via update endpoint might depend on logic (usually separate endpoint or allowed for admin)
      // user.controller.js updateUser usually doesn't allow role update?
      // user.controller.js: updateUser doesn't seem to include 'role' in allowedFields!
      // Role update is separate at PATCH /:userId/role
    } catch (e) {
      console.log('❌ FAIL: Update user failed', e.response?.status, e.response?.data);
    }
  } catch (error) {
    console.error('Test Error:', error);
  } finally {
    console.log('\nCleaning up...');
    try {
      await prisma.user.deleteMany({
        where: {
          email: { in: [adminEmail, 'new_created_user@example.com'] },
        },
      });
      console.log('Cleanup done.');
    } catch (cleanupError) {
      console.log('Cleanup failed:', cleanupError.message);
    }
    await prisma.$disconnect();
  }
}

runTest();
