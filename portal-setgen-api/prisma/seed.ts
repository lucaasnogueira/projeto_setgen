import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Criar usuário ADMIN
  const admin = await prisma.user.upsert({
    where: { email: 'admin@setgen.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@setgen.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  console.log('✅ Usuário ADMIN criado:', {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });

  // Criar usuário GERENTE
  const manager = await prisma.user.upsert({
    where: { email: 'gerente@setgen.com' },
    update: {},
    create: {
      name: 'Gerente',
      email: 'gerente@setgen.com',
      password: await bcrypt.hash('gerente123', 10),
      role: UserRole.MANAGER,
      active: true,
    },
  });

  console.log('✅ Usuário GERENTE criado:', {
    id: manager.id,
    name: manager.name,
    email: manager.email,
    role: manager.role,
  });

  // Criar usuário TÉCNICO
  const technician = await prisma.user.upsert({
    where: { email: 'tecnico@setgen.com' },
    update: {},
    create: {
      name: 'Técnico',
      email: 'tecnico@setgen.com',
      password: await bcrypt.hash('tecnico123', 10),
      role: UserRole.TECHNICIAN,
      active: true,
    },
  });

  console.log('✅ Usuário TÉCNICO criado:', {
    id: technician.id,
    name: technician.name,
    email: technician.email,
    role: technician.role,
  });

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📝 Credenciais de acesso:');
  console.log('ADMIN: admin@setgen.com / admin123');
  console.log('GERENTE: gerente@setgen.com / gerente123');
  console.log('TÉCNICO: tecnico@setgen.com / tecnico123');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
