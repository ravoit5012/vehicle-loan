import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import * as bcrypt from 'bcryptjs';
async function main() {
  // 1️⃣ Create Managers
  const password = await bcrypt.hash('123456', 10);
  const managers = await Promise.all([
    prisma.manager.create({
      data: {
        managerCode: 'MGR001',
        name: 'Manager One',
        username: 'manager',
        password,
        phoneNumber: '+911234567890',
        email: 'manager1@example.com',
        status: true,
        address: '123 Main Street',
        city: 'CityA',
        pincode: '123456',
      },
    }),
    prisma.manager.create({
      data: {
        managerCode: 'MGR002',
        name: 'Manager Two',
        username: 'manager2',
        password,
        phoneNumber: '+911234567891',
        email: 'manager2@example.com',
        status: true,
        address: '456 Market Street',
        city: 'CityB',
        pincode: '654321',
      },
    }),
    prisma.manager.create({
      data: {
        managerCode: 'MGR003',
        name: 'Manager Three',
        username: 'manager3',
        password,
        phoneNumber: '+911234567892',
        email: 'manager3@example.com',
        status: true,
        address: '789 Park Avenue',
        city: 'CityC',
        pincode: '112233',
      },
    }),
  ]);

  console.log('Created managers:', managers.map((m) => m.username));

  // 2️⃣ Create Agents and link to Managers
  const agents = await Promise.all([
    prisma.agent.create({
      data: {
        name: 'Agent One',
        username: 'agent1',
        email: 'agent1@example.com',
        password,
        role: 'AGENT',
        managerId: managers[0].id,
      },
    }),
    prisma.agent.create({
      data: {
        name: 'Agent Two',
        username: 'agent2',
        email: 'agent2@example.com',
        password,
        role: 'AGENT',
        managerId: managers[1].id,
      },
    }),
    prisma.agent.create({
      data: {
        name: 'Agent Three',
        username: 'agent3',
        email: 'agent3@example.com',
        password,
        role: 'AGENT',
        managerId: managers[2].id,
      },
    }),
  ]);

  console.log('Created agents:', agents.map((a) => a.username));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
