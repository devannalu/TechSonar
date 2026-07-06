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

## Próximos módulos

1. Usuários (perfil, configurações)
3. Perfis Organizadores (CRUD, membros, permissões)
4. Eventos (CRUD, publicação, busca)
5. Inscrições (inscrição, cancelamento)
6. Pagamentos (integração Pagar.me)
7. Check-ins (QR Code, validação)
8. Feedbacks (avaliação pós-evento)
9. Certificados (geração, download)
10. Notificações (push via FCM)
