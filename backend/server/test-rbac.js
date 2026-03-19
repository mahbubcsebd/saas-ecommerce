const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API_URL = 'http://localhost:8000/api';

async function testRBAC() {
  try {
    console.log('--- Starting RBAC Test ---');

    // Cleanup first
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'newadmin_fail@example.com',
            'newadmin_success@example.com',
            'newcustomer_success@example.com',
          ],
        },
      },
    });
    console.log('Cleanup previous test users done.');

    // 1. Get Super Admin and Admin tokens (assuming they exist from seed)
    // We need to fetch users to get their credentials or just simulate logging in if we know passwords
    // For simplicity, let's assume we can get tokens if we know email/pass from seed.
    // Seed emails: superadmin@example.com, admin@example.com
    // Password: password123

    console.log('Logging in as Super Admin...');
    const superAdminRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'superadmin@example.com',
      password: 'password123',
    });
    const superAdminToken = superAdminRes.data.data.accessToken;
    console.log('Super Admin logged in.');

    console.log('Logging in as Admin...');
    const adminRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123',
    });
    const adminToken = adminRes.data.data.accessToken;
    console.log('Admin logged in.');

    /*
    // 2. Test: Admin tries to create Admin (Should FAIL)
    console.log('\nTest 1: Admin creating Admin (Expected: 403 Forbidden)');
    try {
        await axios.post(`${API_URL}/admin/users`, {
            email: 'newadmin_fail@example.com',
            firstName: 'Fail',
            lastName: 'Admin',
            role: 'ADMIN',
            password: 'password123'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.error('❌ FAILED: Admin was able to create Admin!');
    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.log('✅ PASSED: Admin cannot create Admin (403 Forbidden).');
        } else {
            console.error('❌ FAILED: Unexpected error:', error.message);
        }
    }
    */

    // 3. Test: Super Admin tries to create Admin (Should PASS)
    console.log('\nTest 2: Super Admin creating Admin (Expected: 201 Created)');
    console.log('Sending request...');
    let newAdminId;
    try {
      const res = await axios.post(
        `${API_URL}/admin/users`,
        {
          email: 'newadmin_success@example.com',
          firstName: 'Success',
          lastName: 'Admin',
          role: 'ADMIN',
          password: 'password123',
          isActive: true,
        },
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );
      console.log('Response received:', res.status);
      if (res.status === 201) {
        console.log('✅ PASSED: Super Admin created Admin.');
        newAdminId = res.data.data.id;
      }
    } catch (error) {
      console.log('Catch block entered');
      console.error(
        '❌ FAILED: Super Admin failed to create Admin:',
        error.response ? JSON.stringify(error.response.data) : error.message
      );
    }
    console.log('Test 2 finished');

    /*
    // 4. Test: Admin creating Customer (Should PASS)
    console.log('\nTest 3: Admin creating Customer (Expected: 201 Created)');
    try {
        const res = await axios.post(`${API_URL}/admin/users`, {
            email: 'newcustomer_success@example.com',
            firstName: 'Success',
            lastName: 'Customer',
            role: 'CUSTOMER',
            password: 'password123'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (res.status === 201) {
            console.log('✅ PASSED: Admin created Customer.');
        }
    } catch (error) {
         console.error('❌ FAILED: Admin failed to create Customer:', error.response ? error.response.data : error.message);
    }
    */

    // Clean up
    if (newAdminId) {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              'newadmin_fail@example.com',
              'newadmin_success@example.com',
              'newcustomer_success@example.com',
            ],
          },
        },
      });
      console.log('\nCleanup done.');
    }
  } catch (error) {
    console.error('Test Script Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRBAC();
