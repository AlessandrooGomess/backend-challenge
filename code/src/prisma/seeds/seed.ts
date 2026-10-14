import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Senha@123';

async function clearDatabase() {
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
}

async function seedCompanies() {
  const alfa = await prisma.company.create({
    data: {
      name: 'Transportes Alfa',
      legalName: 'Transportes Alfa Ltda',
      cnpj: '11222333000181',
      phone: '81999990001',
    },
  });

  const beta = await prisma.company.create({
    data: {
      name: 'Logística Beta',
      legalName: 'Logística Beta S.A.',
      cnpj: '44555666000199',
      phone: '81999990002',
    },
  });

  return { alfa, beta };
}

async function seedUsers(companies: { alfa: { id: string }; beta: { id: string } }) {
  const password = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const users = [
    { name: 'Admin Motiron', email: 'admin@motiron.com', role: Role.ADMIN, companyId: null },
    {
      name: 'Gestor Alfa',
      email: 'gestor@transportes-alfa.com',
      role: Role.MANAGER,
      companyId: companies.alfa.id,
    },
    {
      name: 'Visualizador Alfa',
      email: 'visualizacao@transportes-alfa.com',
      role: Role.VIEWER,
      companyId: companies.alfa.id,
    },
    {
      name: 'Gestor Beta',
      email: 'gestor@logistica-beta.com',
      role: Role.MANAGER,
      companyId: companies.beta.id,
    },
    {
      name: 'Visualizador Beta',
      email: 'visualizacao@logistica-beta.com',
      role: Role.VIEWER,
      companyId: companies.beta.id,
    },
    {
      name: 'Motorista Inativo Alfa',
      email: 'inativo@transportes-alfa.com',
      role: Role.VIEWER,
      companyId: companies.alfa.id,
      isActive: false,
    },
  ];

  await prisma.user.createMany({
    data: users.map(user => ({ ...user, password })),
  });
}

async function main() {
  await clearDatabase();
  const companies = await seedCompanies();
  await seedUsers(companies);

  console.log('Seed concluído com sucesso.');
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
