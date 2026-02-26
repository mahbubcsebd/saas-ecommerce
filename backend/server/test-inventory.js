const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testInventory() {
    console.log("Starting inventory test...");

    // 1. Find the admin user
    const admin = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
    if (!admin) {
        console.error("Admin user not found. Please resolve seeder issues.");
        return;
    }

    // 2. Generate a token (Assuming process.env.JWT_SECRET is accessible or we find it)
    // Actually, making an HTTP request might be complicated if we don't know the JWT_SECRET locally without dotenv.
    // Let's just test the controller logic by calling the controller directly or using Prisma.
    // Wait, let's just make a dummy request to the controller.
    const inventoryController = require('./src/controllers/inventory.controller');

    // Find a product
    const product = await prisma.product.findFirst({ include: { variants: true } });
    if (!product) {
        console.log("No product found to test.");
        return;
    }

    console.log(`Original Product Stock: ${product.stock}`);

    // Mock Express Req/Res
    const req = {
        body: {
            productId: product.id,
            type: 'ADD',
            quantity: 5,
            reason: 'Testing via script'
        },
        params: {},
        query: {}
    };

    const res = {
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            console.log(`Status: ${this.statusCode}`);
            console.log("Response JSON:", JSON.stringify(data, null, 2));
        }
    };

    const next = (err) => {
        console.error("Next called with error:", err);
    };

    // 3. Test adjustStock
    await inventoryController.adjustStock(req, res, next);

    // 4. Verify in DB
    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    console.log(`Updated Product Stock: ${updatedProduct.stock} (Should be ${product.stock + 5})`);

    const movements = await prisma.stockMovement.findMany({ where: { productId: product.id } });
    console.log(`Recorded Movements for Product: ${movements.length}`);
    console.log(movements[movements.length - 1]);
}

testInventory()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
