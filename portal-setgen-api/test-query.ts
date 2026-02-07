
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing OS findMany...');
    const result = await prisma.serviceOrder.findMany({
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            tradeName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log(`Success! Found ${result.length} orders.`);
  } catch (error) {
    console.error('Error in findMany:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
