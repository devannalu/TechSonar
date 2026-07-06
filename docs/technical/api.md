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

## Outros Módulos Planejados

- **Events** (Publicação e gerenciamento de eventos)
- **Registrations** (Inscrições de participantes)
- **Payments** (Processamento de pagamentos via Pagar.me)
- **Check-ins** (Validação via QR Code)
- **Feedbacks** (Avaliação pós-evento)
- **Certificates** (Geração e download de certificados)
- **Notifications** (Push notifications via Firebase)
