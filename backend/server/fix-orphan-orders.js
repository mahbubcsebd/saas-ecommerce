const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetEmail = 'mahbubcseme@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (!user) {
    console.error(`User ${targetEmail} not found!`);
    return;
  }

  console.log(`Found target user: ${user.id}`);

  const allOrders = await prisma.order.findMany();
  console.log(`Checking ${allOrders.length} total orders...`);

  let count = 0;
  for (const order of allOrders) {
    if (!order.userId && order.guestInfo && order.guestInfo.email === targetEmail) {
      console.log(`Linking order ${order.orderNumber} (${order.id})`);
      await prisma.order.update({
        where: { id: order.id },
        data: { userId: user.id },
      });
      count++;
    }
  }

  console.log(`\nSuccessfully linked ${count} orders to ${targetEmail}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
