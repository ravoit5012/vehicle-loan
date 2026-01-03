import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin(name: string, username: string) {
  const exists = await prisma.admin.findUnique({ where: { username }});
  if (!exists) {
    const password = await bcrypt.hash('123456', 10);
    await prisma.admin.create({ data: { name, username, password }});
    console.log(`${username} created`);
  } else {
    console.log(`${username} already exists`);
  }
}

async function main() {
  await createAdmin('Super Admin', 'admin');
  await createAdmin('Admin 2', 'admin2');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
