# Arquitetura

Arquitetura geral do TechSonar.

## Componentes

### Apps

- `apps/mobile` — Aplicativo Flutter

### Services

- `services/api` — API NestJS

### Packages

- `packages/shared` — Código compartilhado futuro

### Database

- PostgreSQL

### ORM

- Prisma

### Payments

- Pagar.me

### Notifications

- Firebase Cloud Messaging

## Fluxo Macro

```txt
Flutter App
  ↓
NestJS API
  ↓
PostgreSQL

NestJS API
  ↓
Pagar.me

NestJS API
  ↓
Firebase Cloud Messaging
```

## Diagrama

```
┌──────────────┐
│  Flutter App  │
└──────┬───────┘
       │ HTTP/REST
       ▼
┌──────────────┐     ┌─────────────┐
│  NestJS API  │────▶│  Pagar.me   │
└──────┬───────┘     └─────────────┘
       │
       ├──────────────────────┐
       ▼                      ▼
┌──────────────┐     ┌─────────────────────┐
│  PostgreSQL  │     │  Firebase Cloud Msg  │
└──────────────┘     └─────────────────────┘
```
