# API

Documentação da API REST do TechSonar.

## Tecnologia

- **Framework:** NestJS
- **Linguagem:** TypeScript
- **ORM:** Prisma
- **Banco:** PostgreSQL

## Autenticação

A autenticação é baseada em JWT (JSON Web Tokens) contendo dois tokens principais:
- **Access Token**: Token de curta duração (15 minutos) usado para acessar rotas protegidas.
- **Refresh Token**: Token de longa duração (7 dias) usado para obter novos pares de tokens sem precisar reinserir as credenciais.

> [!NOTE]
> Fluxos como recuperação de senha, login social e verificação de e-mail estão planejados para fases posteriores.

### Como usar o Access Token
Envie o token no header HTTP `Authorization` de todas as requisições protegidas:
```http
Authorization: Bearer <accessToken>
```

### Como usar o Refresh Token
Envie o token no header HTTP `Authorization` da requisição `POST /auth/refresh`:
```http
Authorization: Bearer <refreshToken>
```

---

## Rotas de Autenticação

### 1. Cadastro de Usuário (`POST /auth/register`)
Cria um usuário no sistema e retorna seus dados seguros + tokens JWT.

- **Request Body**:
```json
{
  "name": "Anna Luiza",
  "email": "anna@example.com",
  "password": "12345678"
}
```

- **Exemplo de Response (201 Created)**:
```json
{
  "user": {
    "id": "c880cd69-8ce8-4ca4-bf4b-e85dcf54aef9",
    "name": "Anna Luiza",
    "email": "anna@example.com",
    "role": "USER",
    "status": "ACTIVE"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUz...",
    "refreshToken": "eyJhbGciOiJIUz..."
  }
}
```

### 2. Login (`POST /auth/login`)
Valida as credenciais do usuário e retorna seus dados + tokens JWT.

- **Request Body**:
```json
{
  "email": "anna@example.com",
  "password": "12345678"
}
```

- **Exemplo de Response (200 OK)**:
```json
{
  "user": {
    "id": "c880cd69-8ce8-4ca4-bf4b-e85dcf54aef9",
    "name": "Anna Luiza",
    "email": "anna@example.com",
    "role": "USER",
    "status": "ACTIVE"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUz...",
    "refreshToken": "eyJhbGciOiJIUz..."
  }
}
```

### 3. Renovar Tokens (`POST /auth/refresh`)
Gera um novo par de tokens JWT recebendo o Refresh Token válido no header.

- **Request Header**:
```http
Authorization: Bearer <refreshToken>
```

- **Exemplo de Response (200 OK)**:
```json
{
  "accessToken": "eyJhbGciOiJIUz...",
  "refreshToken": "eyJhbGciOiJIUz..."
}
```

### 4. Perfil Autenticado (`GET /auth/me`)
Retorna os dados do usuário autenticado a partir do Access Token.

- **Request Header**:
```http
Authorization: Bearer <accessToken>
```

- **Exemplo de Response (200 OK)**:
```json
{
  "id": "c880cd69-8ce8-4ca4-bf4b-e85dcf54aef9",
  "name": "Anna Luiza",
  "email": "anna@example.com",
  "role": "USER",
  "status": "ACTIVE",
  "profile": {
    "id": "de5b94f1-94d3-455b-80a2-25de02652b0f",
    "displayName": null,
    "username": null
  },
  "createdAt": "2026-07-06T13:58:41.000Z"
}
```

---

## Rotas de Usuários e Perfis

### 1. Obter Perfil Completo (`GET /users/me`)
Retorna os dados completos do usuário autenticado e seu perfil (`UserProfile`).
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Exemplo de Response (200 OK)**:
```json
{
  "id": "c880cd69-8ce8-4ca4-bf4b-e85dcf54aef9",
  "name": "Anna Luiza",
  "email": "anna@example.com",
  "role": "USER",
  "status": "ACTIVE",
  "profile": {
    "id": "de5b94f1-94d3-455b-80a2-25de02652b0f",
    "displayName": "Anna",
    "username": "devannalu",
    "phone": null,
    "cpf": null,
    "birthDate": null,
    "avatarUrl": null,
    "bio": null,
    "city": "Salvador",
    "state": "BA",
    "country": "Brasil",
    "notifyEmail": true,
    "notifyPush": true,
    "isPublic": true
  },
  "createdAt": "2026-07-06T13:58:41.000Z",
  "updatedAt": "2026-07-06T13:58:41.000Z"
}
```

### 2. Atualizar Perfil (`PATCH /users/me/profile`)
Permite editar campos de dados do perfil `UserProfile`.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Request Body**:
```json
{
  "displayName": "Anna",
  "username": "devannalu",
  "city": "Salvador",
  "state": "BA"
}
```
- **Exemplo de Response (200 OK)**:
Retorna o perfil (`UserProfile`) atualizado.

### 3. Atualizar Conta (`PATCH /users/me/account`)
Permite editar o nome ou e-mail na conta `User`.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Request Body**:
```json
{
  "name": "Anna Luiza Silva",
  "email": "annasilva@example.com"
}
```
- **Exemplo de Response (200 OK)**:
Retorna o usuário (`User`) atualizado sem `passwordHash`.

### 4. Exclusão Lógica da Conta (`DELETE /users/me`)
Inativa a conta alterando o status para `DELETED`, preenche `deletedAt` com a data atual e anonimiza o e-mail para evitar conflitos futuros, sem remover registros históricos como certificados ou inscrições.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Exemplo de Response (200 OK)**:
```json
{
  "message": "Conta excluída com sucesso."
}
```

---

## Rotas de Perfis Organizadores

### 1. Criar Perfil Organizador (`POST /organizer-profiles`)
Cria um Perfil Organizador associando o criador automaticamente como membro e dono com o papel `OWNER`.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Request Body**:
```json
{
  "type": "COMMUNITY",
  "name": "Tech Sisters",
  "description": "Comunidade para mulheres na tecnologia.",
  "city": "Salvador",
  "state": "BA",
  "country": "Brasil",
  "instagram": "@tech.sisterss",
  "email": "contato@techsonar.com"
}
```
- **Exemplo de Response (201 Created)**:
```json
{
  "id": "7ca6479f-6825-4c07-b353-066cb5dcf54a",
  "ownerId": "c880cd69-8ce8-4ca4-bf4b-e85dcf54aef9",
  "type": "COMMUNITY",
  "name": "Tech Sisters",
  "slug": "tech-sisters",
  "description": "Comunidade para mulheres na tecnologia.",
  "city": "Salvador",
  "state": "BA",
  "country": "Brasil",
  "isVerified": false,
  "isActive": true,
  "createdAt": "2026-07-06T14:27:07.000Z",
  "updatedAt": "2026-07-06T14:27:07.000Z",
  "deletedAt": null
}
```

### 2. Meus Perfis Organizadores (`GET /organizer-profiles/me`)
Lista todos os Perfis Organizadores aos quais o usuário autenticado está vinculado como proprietário ou membro.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Exemplo de Response (200 OK)**:
```json
[
  {
    "id": "7ca6479f-6825-4c07-b353-066cb5dcf54a",
    "name": "Tech Sisters",
    "slug": "tech-sisters",
    "type": "COMMUNITY",
    "city": "Salvador",
    "state": "BA",
    "isVerified": false,
    "isActive": true,
    "memberRole": "OWNER",
    "permissions": ["all"],
    "_count": {
      "events": 0,
      "members": 1
    }
  }
]
```

### 3. Perfil Organizador Público (`GET /organizer-profiles/:id`)
Retorna dados públicos de um Perfil Organizador pelo ID. Rota pública que não exige autenticação.
- **Exemplo de Response (200 OK)**:
```json
{
  "id": "7ca6479f-6825-4c07-b353-066cb5dcf54a",
  "type": "COMMUNITY",
  "name": "Tech Sisters",
  "slug": "tech-sisters",
  "description": "Comunidade para mulheres na tecnologia.",
  "logoUrl": null,
  "bannerUrl": null,
  "city": "Salvador",
  "state": "BA",
  "country": "Brasil",
  "website": null,
  "instagram": "@tech.sisterss",
  "linkedin": null,
  "isVerified": false,
  "isActive": true,
  "createdAt": "2026-07-06T14:27:07.000Z",
  "_count": {
    "events": 0
  }
}
```

### 4. Atualizar Perfil Organizador (`PATCH /organizer-profiles/:id`)
Permite atualizar campos de dados do Perfil Organizador. Exige que o usuário seja OWNER do perfil ou um membro com permissão de OWNER/ADMIN.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Request Body**:
```json
{
  "description": "Nova descrição da comunidade.",
  "instagram": "@techsisters.oficial"
}
```
- **Exemplo de Response (200 OK)**:
Retorna o perfil organizador atualizado.

### 5. Excluir Perfil Organizador (`DELETE /organizer-profiles/:id`)
Exclusão lógica do Perfil Organizador. Altera o status `isActive` para false e preenche `deletedAt` com a data atual. Exige que o usuário seja o OWNER do perfil.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Exemplo de Response (200 OK)**:
```json
{
  "message": "Perfil Organizador excluído com sucesso."
}
```

---

## Rotas de Eventos

### 1. Criar Evento (`POST /events`)
Cria um novo evento no estado de rascunho (`DRAFT`). Exige que o usuário autenticado seja membro ativo do Perfil Organizador com papel `OWNER`, `ADMIN` ou `EVENT_MANAGER`.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Request Body**:
```json
{
  "organizerProfileId": "7ca6479f-6825-4c07-b353-066cb5dcf54a",
  "title": "Tech Girls Night",
  "description": "Evento de lançamento da comunidade Tech Sisters.",
  "category": "Comunidade",
  "format": "ONLINE",
  "startDateTime": "2026-07-24T20:00:00.000Z",
  "endDateTime": "2026-07-24T22:00:00.000Z",
  "timezone": "America/Bahia",
  "onlineUrl": "https://youtube.com/live/exemplo",
  "capacity": 500,
  "isFree": true,
  "price": 0
}
```
- **Exemplo de Response (201 Created)**:
```json
{
  "id": "e88a0322-8ce8-4ca4-bf4b-e85dcf54aef9",
  "organizerProfileId": "7ca6479f-6825-4c07-b353-066cb5dcf54a",
  "title": "Tech Girls Night",
  "slug": "tech-girls-night",
  "description": "Evento de lançamento da comunidade Tech Sisters.",
  "category": "Comunidade",
  "format": "ONLINE",
  "status": "DRAFT",
  "startDateTime": "2026-07-24T20:00:00.000Z",
  "endDateTime": "2026-07-24T22:00:00.000Z",
  "timezone": "America/Bahia",
  "capacity": 500,
  "availableSpots": 500,
  "price": "0.00",
  "isFree": true,
  "hasCertificate": true,
  "createdAt": "2026-07-06T14:40:00.000Z"
}
```

### 2. Listar Eventos Públicos (`GET /events`)
Lista todos os eventos com status `PUBLISHED` e que não estejam deletados. Permite filtros e paginação. Rota pública.
- **Request Query**:
`page=1&limit=10&format=ONLINE&isFree=true`
- **Exemplo de Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "e88a0322-8ce8-4ca4-bf4b-e85dcf54aef9",
      "title": "Tech Girls Night",
      "slug": "tech-girls-night",
      "format": "ONLINE",
      "status": "PUBLISHED",
      "startDateTime": "2026-07-24T20:00:00.000Z",
      "isFree": true,
      "organizerProfile": {
        "id": "7ca6479f-6825-4c07-b353-066cb5dcf54a",
        "name": "Tech Sisters",
        "slug": "tech-sisters",
        "type": "COMMUNITY"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 3. Detalhes Públicos de um Evento (`GET /events/:id`)
Retorna os detalhes completos de um evento publicado. Rota pública.

### 4. Eventos do Organizador (`GET /events/organizer/:organizerProfileId`)
Lista todos os eventos de um organizador (incluindo DRAFT, CANCELED, etc.) para o painel administrativo. Exige que o usuário seja membro do organizador.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```

### 5. Atualizar Evento (`PATCH /events/:id`)
Edita dados de um evento não deletado. Exige papel `OWNER`, `ADMIN` ou `EVENT_MANAGER`.

### 6. Publicar Evento (`PATCH /events/:id/publish`)
Muda o status do evento para `PUBLISHED`. Valida regras e campos mínimos antes da publicação. Exige papel `OWNER`, `ADMIN` ou `EVENT_MANAGER`.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```

### 7. Cancelar Evento (`PATCH /events/:id/cancel`)
Altera o status do evento para `CANCELED`. Exige ser `OWNER` ou `ADMIN` do Perfil Organizador.

### 8. Excluir Evento (`DELETE /events/:id`)
Realiza exclusão lógica preenchendo o `deletedAt` e mudando o status para `ARCHIVED`. Exige ser `OWNER` ou `ADMIN` do organizador.

---

## Rotas de Inscrições

### 1. Criar Inscrição (`POST /registrations`)
Inscreve o usuário autenticado em um evento publicado.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Request Body**:
```json
{
  "eventId": "e88a0322-8ce8-4ca4-bf4b-e85dcf54aef9"
}
```
- **Exemplo de Response (Gratuito - 201 Created)**:
```json
{
  "id": "reg-uuid-12345",
  "status": "CONFIRMED",
  "eventId": "e88a0322-8ce8-4ca4-bf4b-e85dcf54aef9",
  "userId": "user-uuid-12345",
  "ticket": {
    "id": "ticket-uuid-12345",
    "code": "TS-2026-A8F2K9",
    "status": "ACTIVE"
  },
  "event": {
    "id": "e88a0322-8ce8-4ca4-bf4b-e85dcf54aef9",
    "title": "Tech Girls Night",
    "isFree": true
  }
}
```
- **Exemplo de Response (Pago - 201 Created)**:
```json
{
  "id": "reg-uuid-54321",
  "status": "PENDING_PAYMENT",
  "eventId": "pago-event-uuid",
  "userId": "user-uuid-12345",
  "ticket": null,
  "event": {
    "id": "pago-event-uuid",
    "title": "Flutter Advanced",
    "isFree": false,
    "price": "49.90"
  },
  "nextStep": "PAYMENT_REQUIRED"
}
```

### 2. Minhas Inscrições (`GET /registrations/me`)
Retorna todas as inscrições do participante logado, ordenadas pela data de inscrição decrescente.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```

### 3. Detalhes de uma Inscrição (`GET /registrations/:id`)
Retorna detalhes completos de uma inscrição. Permitido apenas para o próprio participante ou membros do Perfil Organizador que gerencia o evento.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```

### 4. Cancelar Inscrição (`DELETE /registrations/:id`)
Cancela a inscrição. Se estiver confirmada (evento gratuito ou pago já compensado), o ticket é cancelado e a vaga é devolvida ao evento (caso o evento ainda não tenha iniciado). Exige ser o próprio participante ou dono/administrador/gerente do Perfil Organizador.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```

### 5. Inscrições do Evento (`GET /registrations/event/:eventId`)
Lista todos os inscritos de um evento para o organizador. Permite paginação, filtro por status e busca textual por nome/email de participante.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```

---

## Rotas de Pagamentos

### 1. Criar Pagamento (`POST /payments`)
Gera uma cobrança Pix no Pagar.me para uma inscrição que esteja no status `PENDING_PAYMENT`.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Request Body**:
```json
{
  "registrationId": "reg-uuid-12345",
  "method": "PIX"
}
```
- **Exemplo de Response (201 Created)**:
```json
{
  "id": "pay-uuid-12345",
  "registrationId": "reg-uuid-12345",
  "status": "PENDING",
  "method": "PIX",
  "amount": "49.90",
  "currency": "BRL",
  "provider": "pagarme",
  "providerOrderId": "order-12345",
  "providerChargeId": "charge-12345",
  "pixQrCode": "https://qr-code-url.png",
  "pixCopyPaste": "00020126360014...",
  "expiresAt": "2026-07-06T15:30:00.000Z",
  "createdAt": "2026-07-06T15:00:00.000Z"
}
```

### 2. Detalhes de um Pagamento (`GET /payments/:id`)
Obtém detalhes do pagamento local. Exige ser o próprio participante dono da inscrição ou membro ativo do Perfil Organizador do evento.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```

### 3. Consultar Pagamento da Inscrição (`GET /payments/registration/:registrationId`)
Permite ao participante consultar o status do pagamento vinculado a sua inscrição.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```

### 4. Webhook do Pagar.me (`POST /payments/webhooks/pagarme`)
Recebe eventos de alteração de status enviados pelo Pagar.me de forma assíncrona. Essa rota é pública e realiza o processamento de forma idempotente.
- **Request Body (Exemplo Pix Pago)**:
```json
{
  "id": "evt_12345",
  "type": "charge.paid",
  "data": {
    "id": "charge-12345",
    "order": {
      "id": "order-12345"
    },
    "status": "paid"
  }
}
```

---

## Rotas de Check-ins

### 1. Registrar Check-in (`POST /checkins`)
Registra presença do próprio participante no evento através do ID do evento.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Request Body**:
```json
{
  "eventId": "e88a0322-8ce8-4ca4-bf4b-e85dcf54aef9"
}
```
- **Exemplo de Response (201 Created)**:
```json
{
  "id": "checkin-uuid-123",
  "eventId": "e88a0322-8ce8-4ca4-bf4b-e85dcf54aef9",
  "userId": "user-uuid-123",
  "registrationId": "reg-uuid-123",
  "method": "QR_CODE",
  "checkedInAt": "2026-07-06T16:30:00.000Z",
  "event": {
    "id": "e88a0322-8ce8-4ca4-bf4b-e85dcf54aef9",
    "title": "Tech Girls Night"
  }
}
```

### 2. Check-in Manual (`POST /checkins/manual`)
Permite ao organizador (OWNER, ADMIN, EVENT_MANAGER, CHECKIN_STAFF) registrar check-in manual para um participante pelo ID da inscrição.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Request Body**:
```json
{
  "registrationId": "reg-uuid-12345",
  "notes": "Documento conferido na entrada."
}
```
- **Exemplo de Response (201 Created)**:
```json
{
  "id": "checkin-uuid-456",
  "registrationId": "reg-uuid-12345",
  "eventId": "event-uuid-123",
  "userId": "user-uuid-789",
  "method": "MANUAL",
  "validatedById": "organizer-user-uuid",
  "notes": "Documento conferido na entrada.",
  "checkedInAt": "2026-07-06T16:30:00.000Z"
}
```

### 3. Consultar Meu Check-in por Evento (`GET /checkins/me/event/:eventId`)
Retorna se o participante autenticado já possui presença registrada em um evento.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Exemplo de Response (200 OK - Sim)**:
```json
{
  "hasCheckin": true,
  "checkin": {
    "id": "checkin-uuid-123",
    "method": "QR_CODE",
    "checkedInAt": "2026-07-06T16:30:00.000Z"
  }
}
```

### 4. Listar Check-ins do Evento (`GET /checkins/event/:eventId`)
Lista todos os check-ins registrados para o painel do organizador. Permite paginação, filtros e busca textual por nome/email de participante.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```

### 5. Detalhes de um Check-in (`GET /checkins/:id`)
Retorna detalhes completos de um check-in pelo ID. Acesso liberado ao próprio participante ou a membros do Perfil Organizador.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```

---

## Rotas de Feedbacks

### 1. Registrar Feedback (`POST /feedbacks`)
Registra a avaliação do participante sobre o evento. Exige que o participante tenha check-in confirmado (status `CHECKED_IN`).
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Request Body**:
```json
{
  "registrationId": "reg-uuid-12345",
  "overallRating": 5,
  "contentRating": 5,
  "organizationRating": 4,
  "speakerRating": 5,
  "positiveComment": "Evento muito bom.",
  "improvementComment": "Mais tempo para networking.",
  "wouldRecommend": true
}
```
- **Exemplo de Response (201 Created)**:
```json
{
  "id": "feedback-uuid-123",
  "registrationId": "reg-uuid-12345",
  "eventId": "event-uuid-123",
  "userId": "user-uuid-123",
  "overallRating": 5,
  "contentRating": 5,
  "organizationRating": 4,
  "speakerRating": 5,
  "positiveComment": "Evento muito bom.",
  "improvementComment": "Mais tempo para networking.",
  "wouldRecommend": true,
  "createdAt": "2026-07-06T16:56:00.000Z"
}
```

### 2. Consultar Meu Feedback (`GET /feedbacks/me/event/:eventId`)
Obtém o feedback enviado pelo próprio participante para o evento.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```

### 3. Listar Feedbacks do Evento (`GET /feedbacks/event/:eventId`)
Retorna feedbacks do evento com paginação, filtros por nota e busca textual por participante. Exige ser membro da organização do evento.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```

### 4. Consultar Métricas de Feedback (`GET /feedbacks/event/:eventId/metrics`)
Consolida médias aritméticas das notas e a taxa de recomendação em porcentagem para o painel administrativo. Exige ser membro da organização do evento.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```
- **Exemplo de Response (200 OK)**:
```json
{
  "eventId": "event-uuid-123",
  "totalFeedbacks": 10,
  "averageOverallRating": 4.7,
  "averageContentRating": 4.8,
  "averageOrganizationRating": 4.6,
  "averageSpeakerRating": 4.9,
  "recommendationRate": 90,
  "ratingDistribution": {
    "1": 0,
    "2": 0,
    "3": 1,
    "4": 2,
    "5": 7
  }
}
```

### 5. Detalhes de um Feedback (`GET /feedbacks/:id`)
Retorna detalhes completos do feedback. Liberado ao próprio participante ou a membros do Perfil Organizador.
- **Request Header**:
```http
Authorization: Bearer <accessToken>
```

---

## Outros Módulos Planejados

- **Certificates** (Geração e download de certificados)
- **Notifications** (Push notifications via Firebase)
