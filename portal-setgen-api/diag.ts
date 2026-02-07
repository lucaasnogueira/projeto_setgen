
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Fetching first 5 service orders...');
    const orders = await prisma.serviceOrder.findMany({
      take: 5,
      include: {
        client: true,
        createdBy: true,
      }
    });
    
    console.log(`Found ${orders.length} orders.`);
    orders.forEach(order => {
      console.log(`Order: ${order.orderNumber}`);
      console.log(`- Client: ${order.client ? order.client.companyName : 'MISSING'}`);
      console.log(`- CreatedBy: ${order.createdBy ? order.createdBy.name : 'MISSING'}`);
    });

  } catch (error) {
    console.error('DIAGNOSTIC ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
