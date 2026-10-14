import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import { VehicleType } from '../../modules/vehicles/enums/vehicle-type.enum';

const prisma = new PrismaClient();

const vehicle = (
  plate: string,
  brand: string,
  model: string,
  year: number,
  vehicleType: VehicleType,
) => ({
  plate,
  brand,
  model,
  year,
  vehicleType,
});

async function main() {
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const alfa = await prisma.company.create({
    data: { name: 'Transportes Alfa', legalName: 'Transportes Alfa Ltda', cnpj: '11222333000181' },
  });
  const beta = await prisma.company.create({
    data: { name: 'Logística Beta', legalName: 'Logística Beta S.A.', cnpj: '44555666000199' },
  });

  const password = await bcrypt.hash('Senha@123', 10);
  await prisma.user.createMany({
    data: [
      { name: 'Admin Motiron', email: 'admin@motiron.com', role: Role.ADMIN },
      {
        name: 'Gestor Alfa',
        email: 'gestor@transportes-alfa.com',
        role: Role.MANAGER,
        companyId: alfa.id,
      },
      {
        name: 'Visualizador Alfa',
        email: 'visualizacao@transportes-alfa.com',
        role: Role.VIEWER,
        companyId: alfa.id,
      },
      {
        name: 'Gestor Beta',
        email: 'gestor@logistica-beta.com',
        role: Role.MANAGER,
        companyId: beta.id,
      },
      {
        name: 'Visualizador Beta',
        email: 'visualizacao@logistica-beta.com',
        role: Role.VIEWER,
        companyId: beta.id,
      },
    ].map(user => ({ ...user, password })),
  });

  const alfaVehicles = [
    vehicle('ABC1D23', 'Fiat', 'Strada', 2022, VehicleType.CAR),
    vehicle('BRA2E19', 'Volkswagen', 'Gol', 2019, VehicleType.CAR),
    vehicle('QWE4567', 'Chevrolet', 'Onix', 2018, VehicleType.CAR),
    vehicle('HND3F45', 'Honda', 'CG 160', 2023, VehicleType.MOTORCYCLE),
    vehicle('YMH5G67', 'Yamaha', 'Factor 150', 2021, VehicleType.MOTORCYCLE),
    vehicle('SCN1A11', 'Scania', 'R 450', 2020, VehicleType.TRUCK),
    vehicle('VLV2B22', 'Volvo', 'FH 540', 2024, VehicleType.TRUCK),
    { ...vehicle('SPR3C33', 'Mercedes-Benz', 'Sprinter', 2017, VehicleType.VAN), isActive: false },
    { ...vehicle('DEL4D44', 'Renault', 'Kangoo', 2015, VehicleType.VAN), deletedAt: new Date() },
  ];
  const betaVehicles = [
    vehicle('ABC1D23', 'Toyota', 'Hilux', 2023, VehicleType.CAR),
    vehicle('JKL8901', 'Hyundai', 'HB20', 2020, VehicleType.CAR),
    vehicle('MNO2H34', 'Renault', 'Master', 2022, VehicleType.VAN),
    vehicle('FRD6J78', 'Ford', 'Transit', 2025, VehicleType.VAN),
    { ...vehicle('IVC9K01', 'Iveco', 'Daily', 2016, VehicleType.TRUCK), isActive: false },
    vehicle('BMW7L23', 'BMW', 'G 310 R', 2024, VehicleType.MOTORCYCLE),
    vehicle('DAF4M56', 'DAF', 'XF 480', 2021, VehicleType.TRUCK),
  ];
  await prisma.vehicle.createMany({
    data: [
      ...alfaVehicles.map(v => ({ ...v, companyId: alfa.id })),
      ...betaVehicles.map(v => ({ ...v, companyId: beta.id })),
    ],
  });

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
