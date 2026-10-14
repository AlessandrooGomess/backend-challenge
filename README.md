# Motiron — Teste Técnico (Backend)

Bem-vindo(a)! Este repositório é uma **base simplificada** de uma API de gestão
de frota preparada para um **teste técnico de backend**. O objetivo é avaliar
como você implementa um módulo novo **seguindo os padrões já existentes** no
projeto.

> ⚙️ A API usa **NestJS + Prisma + PostgreSQL**. O banco sobe com **Docker**
> (um único `docker compose up -d`) — não é preciso instalar o PostgreSQL.

> ⏰ **Prazo de entrega: DD/MM/AAAA, até as 23h59.** Se você fizer
> commits **após** esse horário, sem problema — avaliaremos tudo o que foi feito
> **até DD/MM/AAAA, 23h59**.

---

## 📌 Resumo do que você precisa fazer

| Desafio | Status | Onde |
| --- | --- | --- |
| **Módulo de Veículos** | ✅ Obrigatório | `code/src/modules/vehicles` |
| **Abastecimentos + relatório de consumo** | ⭐ Opcional (bônus) | `code/src/modules/vehicles` (ou um módulo novo) |
| **Testes unitários** | ⭐ Opcional (bônus) | `*.spec.ts` ao lado do service |

- **Veículos:** existe apenas o "esqueleto" (model no Prisma, migration, enum,
  permissão e seed). Você deve implementar o CRUD completo seguindo os padrões
  dos módulos **Empresas** (`companies`) e **Usuários** (`users`), que já estão
  prontos. Contrato e regras em
  [`code/src/modules/vehicles/README.md`](code/src/modules/vehicles/README.md).
- **Bônus:** desafios **opcionais**, descritos [mais abaixo](#-desafios-opcionais-bônus).

---

## 📤 Como participar (fork)

Você deve **fazer um fork** deste projeto e desenvolver o desafio **no seu
próprio GitHub** — não trabalhe diretamente neste repositório.

1. Faça o **fork** deste repositório para a sua conta do GitHub (botão **Fork**
   no canto superior direito).
2. **Clone o seu fork** e desenvolva nele:
   ```bash
   git clone https://github.com/<seu-usuario>/backend-challenge.git
   ```
3. Implemente o desafio fazendo **commits no seu fork**, seguindo o
   [padrão de commits](#-padrão-de-commits) recomendado.
4. Ao finalizar, **envie o link do seu fork** para o avaliador.

> Mantenha o seu fork **público** para que o avaliador consiga acessá-lo.

> 🔒 **Confidencialidade:** este projeto contém diretamente a base de código da
> **Motiron Technologies**. Após a conclusão da avaliação, você deve **excluir o
> seu fork** do GitHub. Ao participar do teste, você concorda com estes termos.

---

## 🚀 Como rodar

Pré-requisitos: **Node.js 20+**, npm e **Docker**.

```bash
docker compose up -d       # sobe o PostgreSQL na porta 5433
cd code
cp .env.example .env
npm install
npm run db:migrate         # aplica as migrations
npm run db:seed            # popula empresas, usuários e veículos
npm run start:dev
```

A API sobe em **http://localhost:3000** (`GET /health` para conferir).

### Usuários do seed

Todos com a senha **`Senha@123`**. Faça `POST /auth/login` e use o
`accessToken` retornado no header `Authorization: Bearer <token>`.

| E-mail | Perfil | Empresa |
| --- | --- | --- |
| `admin@motiron.com` | Administrador | — (acesso a todas) |
| `gestor@transportes-alfa.com` | Gestor | Transportes Alfa |
| `visualizacao@transportes-alfa.com` | Visualização | Transportes Alfa |
| `gestor@logistica-beta.com` | Gestor | Logística Beta |
| `visualizacao@logistica-beta.com` | Visualização | Logística Beta |

> ℹ️ `npm run db:reset` apaga o banco, reaplica as migrations e roda o seed de
> novo. Exemplos de requisições prontos em
> [`code/src/modules/vehicles/api-examples.http`](code/src/modules/vehicles/api-examples.http).

---

## 🧱 Stack

- **NestJS 11** + **TypeScript**
- **Prisma 6** + **PostgreSQL 17** (via Docker)
- **Zod** com `nestjs-zod` (validação de DTOs)
- **JWT** (`@nestjs/jwt`) e **CASL** (permissões por perfil)
- **Jest** (testes), **ESLint** + **Prettier**

---

## 🗂️ Estrutura do projeto

```
code/src/
├── main.ts / app.module.ts   # Bootstrap e registro dos módulos
├── prisma/                   # schema.prisma, migrations, seed e PrismaService
│
├── common/                   # Infra transversal
│   ├── decorators/           # @Public, @CurrentUser, @Can
│   ├── guards/               # AuthGuard (JWT) e PoliciesGuard (CASL)
│   ├── interfaces/           # AuthUser
│   ├── filters/              # AllExceptionsFilter
│   ├── services/             # CompanyScopeResolver
│   └── dtos/                 # Paginação/ordenação compartilhadas
│
└── modules/                  # Módulos de domínio
    ├── auth/                 # POST /auth/login
    ├── ability/              # Permissões por perfil (CASL)
    ├── companies/            # ✅ Referência (completo + teste unitário)
    ├── users/                # ✅ Referência (completo)
    └── vehicles/             # 🛠️ DESAFIO (só model, enum e instruções)
```

### Referência de organização

Use os módulos `companies` e `users` como referência e estruture o seu módulo
na mesma linha.

---

## 🛠️ Desafio principal (obrigatório): Módulo de Veículos

Implemente o **módulo `vehicles` completo** — criar, listar (com paginação e
filtros), detalhar, editar e excluir — e registre-o em `code/src/app.module.ts`.
O contrato dos endpoints e as regras de negócio estão em
[`code/src/modules/vehicles/README.md`](code/src/modules/vehicles/README.md).

O que **já vem pronto** (não precisa criar): model `Vehicle` + migration, enum
`VehicleType`, permissão e veículos no seed.

---

## ⭐ Desafios opcionais (bônus)

### 1. Abastecimentos

Crie o model `Refueling` (com migration) para registrar abastecimentos de um
veículo: **data**, **litros**, **valor total** e **hodômetro** (km).

- `POST /vehicles/:id/refuelings` e `GET /vehicles/:id/refuelings` (paginado).
- Litros e valor devem ser maiores que zero; só veículos **ativos** recebem
  abastecimento.
- O hodômetro deve ser **maior** que o do abastecimento anterior do veículo
  (por data). Diferencial: tratar abastecimentos lançados "no meio" do
  histórico (o hodômetro também deve ser menor que o do próximo).
- Adicione a permissão `Refueling` em `modules/ability` (mesmas regras de
  `Vehicle` por perfil). O escopo por empresa vem do veículo.

### 2. Relatório de consumo

`GET /vehicles/:id/consumption?startDate=AAAA-MM-DD&endDate=AAAA-MM-DD`

```json
{
  "vehicleId": "clx...",
  "plate": "ABC1D23",
  "period": { "startDate": "2026-01-01", "endDate": "2026-01-31" },
  "totalKm": 1200,
  "totalLiters": 100,
  "totalSpent": 620.5,
  "averageKmPerLiter": 12,
  "averageCostPerKm": 0.52
}
```

Considere os abastecimentos do período, em ordem de data:

- `totalKm` = hodômetro do último − hodômetro do primeiro;
- `totalLiters` e `totalSpent` = soma dos abastecimentos **exceto o primeiro**
  (os litros de um abastecimento repõem o que foi rodado *desde o anterior*, então
  os do primeiro correspondem a quilômetros rodados antes do período);
- `averageKmPerLiter` = `totalKm / totalLiters`; `averageCostPerKm` = `totalSpent / totalKm`.

Com menos de dois abastecimentos no período não há como calcular a média —
decida e documente como a API responde nesse caso.

### 3. Testes unitários

Escreva testes para o `VehiclesService` no mesmo estilo de
`companies/services/companies.service.spec.ts` (`npm test`).

---

## 📝 Padrão de commits

Utilize **commits semânticos, sem emoji**, onde cada mensagem começa com o tipo,
seguido de dois pontos e uma descrição curta em inglês.

---

Boa sorte! 🚀
