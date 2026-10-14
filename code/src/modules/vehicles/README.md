# Desafio — Módulo de Veículos (vehicles)

Implemente o CRUD de veículos seguindo os padrões dos módulos `companies` e `users`,
e registre o `VehiclesModule` no `src/app.module.ts`.

## O que já vem pronto

- Model `Vehicle` no `schema.prisma` + migration (a tabela já existe no banco).
- Enum `VehicleType` (`enums/vehicle-type.enum.ts`).
- Permissão `Vehicle` em `src/modules/ability`.
- Veículos no seed.

## Endpoints

| Método | Rota | Descrição | Resposta |
| --- | --- | --- | --- |
| `POST` | `/vehicles` | Cria um veículo | `201` `{ id, message }` |
| `GET` | `/vehicles` | Lista paginada com filtros | `200` `{ data, meta }` |
| `GET` | `/vehicles/:id` | Detalhe de um veículo | `200` objeto do veículo |
| `PATCH` | `/vehicles/:id` | Atualiza parcialmente | `200` `{ id, message }` |
| `DELETE` | `/vehicles/:id` | Exclui (soft delete) | `204` sem corpo |

## Campos e validações

| Campo | Regra |
| --- | --- |
| `plate` | Obrigatório. Aceita minúsculas e hífen (`abc-1d23` → `ABC1D23`); formato antigo (`ABC1234`) ou Mercosul (`ABC1D23`). |
| `brand` | Obrigatório, 2 a 50 caracteres. |
| `model` | Obrigatório, 2 a 50 caracteres. |
| `year` | Obrigatório, inteiro entre **1950** e o **ano atual + 1**. |
| `vehicleType` | Obrigatório, um dos valores de `VehicleType`. |
| `isActive` | Opcional, booleano (padrão `true`). |
| `description` | Opcional, até 255 caracteres. |
| `companyId` | Obrigatório para Administrador; para os demais perfis é a empresa do usuário logado. |

Mensagens de validação e de erro em português.

## Filtros da listagem (`GET /vehicles`)

- `search` — placa, marca ou modelo (sem diferenciar maiúsculas/minúsculas);
- `vehicleType` — um ou vários (`?vehicleType=Carro&vehicleType=Van`);
- `isActive` — `true`/`false`;
- `companyId`;
- `page`, `limit`, `orderBy` (`plate`, `year`, `brand`, `createdAt`) e `order` (`asc`/`desc`).

## Regras de negócio

- Placa única por empresa entre veículos não excluídos → `409`.
- Veículo de outra empresa → `404`.
- `Visualização` não pode criar, editar nem excluir → `403`.
- Soft delete: veículos excluídos não aparecem em nenhum endpoint.
