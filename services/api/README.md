# TechSonar — API

API backend oficial do TechSonar, desenvolvida com **NestJS + TypeScript**.

## Stack

| Tecnologia               | Uso                          |
| ------------------------ | ---------------------------- |
| NestJS                   | Framework backend            |
| TypeScript               | Linguagem                    |
| PostgreSQL               | Banco de dados               |
| Prisma                   | ORM                          |
| Swagger / OpenAPI        | Documentação da API          |
| Docker                   | Container para PostgreSQL    |
| Pagar.me                 | Gateway de pagamento (futuro)|
| Firebase Cloud Messaging | Notificações push (futuro)   |

## Pré-requisitos

- Node.js 20+ (LTS)
- npm
- Docker e Docker Compose

## Instalação

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env

# Subir PostgreSQL com Docker
docker compose up -d

# Gerar o client do Prisma
npx prisma generate

# Rodar migrations (quando houver models)
npx prisma migrate dev
```

## Rodando a API

```bash
# Modo desenvolvimento (com hot-reload)
npm run start:dev

# Modo produção
npm run build
npm run start:prod
```

## URLs

| Recurso       | URL                               |
| ------------- | --------------------------------- |
| API           | http://localhost:3000              |
| Health Check  | http://localhost:3000/health       |
| Swagger Docs  | http://localhost:3000/api/docs     |

## Scripts disponíveis

| Script              | Descrição                          |
| ------------------- | ---------------------------------- |
| `npm run start`     | Inicia a API                       |
| `npm run start:dev` | Inicia com hot-reload              |
| `npm run build`     | Build de produção                  |
| `npm run lint`      | Lint do código                     |
| `npm run format`    | Formata o código                   |
| `npm run test`      | Roda testes unitários              |
| `npm run prisma:generate` | Gera o Prisma Client         |
| `npm run prisma:migrate`  | Roda migrations              |
| `npm run prisma:studio`   | Abre o Prisma Studio         |

## Estrutura de pastas

```
services/api/
├── src/
│   ├── main.ts                  # Bootstrap da aplicação
│   ├── app.module.ts            # Módulo raiz
│   ├── config/                  # Configurações
│   ├── common/                  # Decorators, filters, guards, etc.
│   ├── modules/                 # Módulos da aplicação
│   │   ├── health/              # Health check
│   │   ├── auth/                # Autenticação (futuro)
│   │   ├── users/               # Usuários (futuro)
│   │   ├── organizer-profiles/  # Perfis Organizadores (futuro)
│   │   ├── events/              # Eventos (futuro)
│   │   ├── registrations/       # Inscrições (futuro)
│   │   ├── payments/            # Pagamentos (futuro)
│   │   ├── checkins/            # Check-ins (futuro)
│   │   ├── feedbacks/           # Feedbacks (futuro)
│   │   ├── certificates/        # Certificados (futuro)
│   │   └── notifications/       # Notificações (futuro)
│   └── prisma/                  # Prisma service
├── prisma/
│   └── schema.prisma            # Schema do banco de dados
├── test/                        # Testes e2e
├── docker-compose.yml           # PostgreSQL local
├── Dockerfile                   # Build de produção
├── .env.example                 # Variáveis de ambiente
└── package.json
```

## Database Schema

O schema inicial do banco foi criado com Prisma e PostgreSQL.

Entidades principais:
- User
- UserProfile
- OrganizerProfile
- OrganizerMember
- Event
- Registration
- Ticket
- Payment
- PaymentWebhookLog
- Coupon
- Checkin
- Feedback
- Certificate
- Notification
- AuditLog

## Autenticação

A autenticação real está implementada via JWT com Access Token e Refresh Token.

### Rotas disponíveis
- `POST /auth/register` — Cadastro de usuário
- `POST /auth/login` — Login
- `POST /auth/refresh` — Atualizar Access/Refresh Token (necessita Refresh Token em `Authorization: Bearer <token>`)
- `GET /auth/me` — Obter dados do usuário logado (necessita Access Token em `Authorization: Bearer <token>`)

Para mais detalhes e exemplos, veja a documentação de [API](../../docs/technical/api.md).

## Users/Profile

Permite ao usuário autenticado obter e gerenciar seus próprios dados.

### Rotas disponíveis
- `GET /users/me` — Obter perfil completo do usuário autenticado
- `PATCH /users/me/profile` — Editar campos do perfil (`UserProfile`)
- `PATCH /users/me/account` — Editar dados básicos da conta (`User`)
- `DELETE /users/me` — Exclusão lógica da conta

## Organizer Profiles

Permite criar e gerenciar Perfis Organizadores de eventos.

### Rotas disponíveis
- `POST /organizer-profiles` — Criar um Perfil Organizador (associa o criador como OWNER)
- `GET /organizer-profiles/me` — Listar Perfis Organizadores onde o usuário logado é dono ou membro
- `GET /organizer-profiles/:id` — Obter dados públicos de um perfil organizador (público)
- `PATCH /organizer-profiles/:id` — Editar Perfil Organizador (exige ser OWNER ou ADMIN do perfil)
- `DELETE /organizer-profiles/:id` — Exclusão lógica do Perfil Organizador (exige ser OWNER do perfil)

## Events

Permite gerenciar eventos de tecnologia.

### Rotas disponíveis
- `POST /events` — Criar evento em rascunho (exige permissão OWNER, ADMIN ou EVENT_MANAGER)
- `GET /events` — Listar eventos publicados (público, com paginação e filtros)
- `GET /events/:id` — Detalhes públicos de um evento pelo ID (público)
- `GET /events/organizer/:organizerProfileId` — Listar todos os eventos (qualquer status) de um organizador (exige ser membro do perfil)
- `PATCH /events/:id` — Editar dados de um evento (exige OWNER, ADMIN ou EVENT_MANAGER)
- `PATCH /events/:id/publish` — Publicar um evento (exige OWNER, ADMIN ou EVENT_MANAGER e valida campos mínimos)
- `PATCH /events/:id/cancel` — Cancelar um evento (exige OWNER ou ADMIN)
- `DELETE /events/:id` — Exclusão lógica do evento (exige OWNER ou ADMIN)

## Registrations

Permite que os participantes se inscrevam nos eventos.

### Rotas disponíveis
- `POST /registrations` — Inscrever-se em um evento (gratuito: confirma imediatamente e gera ticket; pago: cria inscrição pendente de pagamento)
- `GET /registrations/me` — Listar inscrições do próprio usuário autenticado
- `GET /registrations/:id` — Obter detalhes de uma inscrição específica
- `DELETE /registrations/:id` — Cancelar uma inscrição (devolve a vaga ao evento se estava confirmada e se o evento não tiver iniciado)
- `GET /registrations/event/:eventId` — Listar inscrições de um evento específico (exige ser membro do perfil organizador)

## Payments

Permite gerar e processar pagamentos integrados com o gateway **Pagar.me**.

### Rotas disponíveis
- `POST /payments` — Criar intenção de pagamento para inscrição pendente (gera QR Code / Copia e Cola para Pix)
- `GET /payments/:id` — Obter detalhes de um pagamento específico
- `GET /payments/registration/:registrationId` — Consultar pagamento vinculado a uma inscrição
- `POST /payments/webhooks/pagarme` — Webhook público para recepção e processamento de eventos do Pagar.me (idempotente)

## Check-ins

Permite registrar presença (check-in) de participantes confirmados em eventos.

### Rotas disponíveis
- `POST /checkins` — Registrar presença do próprio participante via QR Code (exige inscrição confirmada e ingresso ativo)
- `POST /checkins/manual` — Registrar check-in manual de um participante (exige permissão OWNER, ADMIN, EVENT_MANAGER ou CHECKIN_STAFF do organizador)
- `GET /checkins/me/event/:eventId` — Obter status e detalhes do check-in do próprio participante para um evento
- `GET /checkins/event/:eventId` — Listar check-ins de um evento (exige ser membro do organizador)
- `GET /checkins/:id` — Obter detalhes de um check-in pelo ID

## Feedbacks

Permite enviar avaliações pós-evento de participantes presentes.

### Rotas disponíveis
- `POST /feedbacks` — Enviar feedback pós-evento (exige inscrição no status CHECKED_IN)
- `GET /feedbacks/me/event/:eventId` — Obter o feedback enviado pelo próprio participante para o evento
- `GET /feedbacks/event/:eventId` — Listar feedbacks de um evento (exige ser membro do organizador)
- `GET /feedbacks/event/:eventId/metrics` — Consultar médias de notas e distribuição de recomendações do evento (exige ser membro do organizador)
- `GET /feedbacks/:id` — Obter detalhes de um feedback específico pelo ID

Para mais detalhes e exemplos, veja a documentação de [API](../../docs/technical/api.md).

## Próximos módulos

1. Certificados (geração, download)
2. Notificações (push via FCM)
