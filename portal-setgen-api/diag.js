
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const logFile = 'diag_error.log';
  fs.writeFileSync(logFile, `Starting diag at ${new Date().toISOString()}\n`);
  try {
    const orders = await prisma.serviceOrder.findMany({
      include: {
        client: true,
        createdBy: true,
      }
    });
    fs.appendFileSync(logFile, `Found ${orders.length} orders.\n`);
  } catch (error) {
    fs.appendFileSync(logFile, `DIAGNOSTIC ERROR: ${error.stack || error}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
