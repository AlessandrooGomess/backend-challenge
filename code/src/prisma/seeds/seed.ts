import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import { VehicleType } from '../../modules/vehicles/enums/vehicle-type.enum';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'Senha@123';

async function clearDatabase() {
  await prisma.vehicle.deleteMany();
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

async function seedVehicles(companies: { alfa: { id: string }; beta: { id: string } }) {
  const { alfa, beta } = companies;

  await prisma.vehicle.createMany({
    data: [
      {
        companyId: alfa.id,
        plate: 'ABC1D23',
        brand: 'Fiat',
        model: 'Strada',
        year: 2022,
        vehicleType: VehicleType.CAR,
        description: 'Picape de apoio',
      },
      {
        companyId: alfa.id,
        plate: 'BRA2E19',
        brand: 'Volkswagen',
        model: 'Gol',
        year: 2019,
        vehicleType: VehicleType.CAR,
      },
      {
        companyId: alfa.id,
        plate: 'QWE4567',
        brand: 'Chevrolet',
        model: 'Onix',
        year: 2018,
        vehicleType: VehicleType.CAR,
      },
      {
        companyId: alfa.id,
        plate: 'HND3F45',
        brand: 'Honda',
        model: 'CG 160',
        year: 2023,
        vehicleType: VehicleType.MOTORCYCLE,
        description: 'Entregas rápidas',
      },
      {
        companyId: alfa.id,
        plate: 'YMH5G67',
        brand: 'Yamaha',
        model: 'Factor 150',
        year: 2021,
        vehicleType: VehicleType.MOTORCYCLE,
      },
      {
        companyId: alfa.id,
        plate: 'SCN1A11',
        brand: 'Scania',
        model: 'R 450',
        year: 2020,
        vehicleType: VehicleType.TRUCK,
        description: 'Cavalo mecânico',
      },
      {
        companyId: alfa.id,
        plate: 'VLV2B22',
        brand: 'Volvo',
        model: 'FH 540',
        year: 2024,
        vehicleType: VehicleType.TRUCK,
      },
      {
        companyId: alfa.id,
        plate: 'SPR3C33',
        brand: 'Mercedes-Benz',
        model: 'Sprinter',
        year: 2017,
        vehicleType: VehicleType.VAN,
        isActive: false,
        description: 'Em manutenção',
      },
      {
        companyId: alfa.id,
        plate: 'DEL4D44',
        brand: 'Renault',
        model: 'Kangoo',
        year: 2015,
        vehicleType: VehicleType.VAN,
        deletedAt: new Date('2026-01-10T12:00:00Z'),
      },
      {
        companyId: beta.id,
        plate: 'ABC1D23',
        brand: 'Toyota',
        model: 'Hilux',
        year: 2023,
        vehicleType: VehicleType.CAR,
      },
      {
        companyId: beta.id,
        plate: 'JKL8901',
        brand: 'Hyundai',
        model: 'HB20',
        year: 2020,
        vehicleType: VehicleType.CAR,
      },
      {
        companyId: beta.id,
        plate: 'MNO2H34',
        brand: 'Renault',
        model: 'Master',
        year: 2022,
        vehicleType: VehicleType.VAN,
      },
      {
        companyId: beta.id,
        plate: 'FRD6J78',
        brand: 'Ford',
        model: 'Transit',
        year: 2025,
        vehicleType: VehicleType.VAN,
      },
      {
        companyId: beta.id,
        plate: 'IVC9K01',
        brand: 'Iveco',
        model: 'Daily',
        year: 2016,
        vehicleType: VehicleType.TRUCK,
        isActive: false,
      },
      {
        companyId: beta.id,
        plate: 'BMW7L23',
        brand: 'BMW',
        model: 'G 310 R',
        year: 2024,
        vehicleType: VehicleType.MOTORCYCLE,
      },
      {
        companyId: beta.id,
        plate: 'DAF4M56',
        brand: 'DAF',
        model: 'XF 480',
        year: 2021,
        vehicleType: VehicleType.TRUCK,
        description: 'Rota Recife–Salvador',
      },
    ],
  });
}

async function main() {
  await clearDatabase();
  const companies = await seedCompanies();
  await seedUsers(companies);
  await seedVehicles(companies);

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
