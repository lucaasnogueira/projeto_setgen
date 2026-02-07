
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const logFile = 'diag_verify.log';
  fs.writeFileSync(logFile, `Starting verification at ${new Date().toISOString()}\n`);
  try {
    const orders = await prisma.serviceOrder.findMany({
      include: {
        client: true,
        createdBy: true,
      }
    });
    fs.appendFileSync(logFile, `Found ${orders.length} orders. SUCCESS!\n`);
  } catch (error) {
    fs.appendFileSync(logFile, `VERIFICATION ERROR: ${error.stack || error}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
