# Pagamentos

Documentação da integração de pagamentos do TechSonar.

## Gateway Oficial

O gateway oficial de pagamento será **Pagar.me**.

## Regra de Segurança

O app mobile **nunca** deve se comunicar diretamente com o Pagar.me usando chaves secretas.

## Fluxo Correto

1. App solicita pagamento para a API
2. API cria cobrança no Pagar.me
3. Pagar.me processa pagamento
4. Pagar.me envia webhook para a API
5. API atualiza o status do pagamento
6. API libera a inscrição/ingresso

## Diagrama

```
┌──────────┐     ┌──────────┐     ┌───────────┐
│  Mobile  │────▶│   API    │────▶│  Pagar.me │
│   App    │     │  NestJS  │◀────│  Webhook  │
└──────────┘     └────┬─────┘     └───────────┘
                      │
                      ▼
               ┌──────────────┐
               │  PostgreSQL  │
               └──────────────┘
```

## Regras de Negócio e Implementação

### 1. Fluxo de Pix
- O pagamento Pix é gerado no Pagar.me com expiração de 30 minutos (`PAGARME_PIX_EXPIRES_IN_SECONDS`).
- A API do TechSonar armazena localmente os códigos de Pix Copia e Cola, QR Code e os IDs da transação (`providerOrderId`, `providerChargeId`).
- Caso exista um pagamento Pix pendente não expirado para a inscrição, ele é reaproveitado para evitar criação de múltiplos pedidos no Pagar.me.

### 2. Confirmação por Webhook e Idempotência
- A confirmação definitiva do pagamento é realizada pelo webhook `/payments/webhooks/pagarme`.
- É garantido que cada webhook recebido é registrado em `PaymentWebhookLog` para fins de auditoria.
- Caso o pagamento já tenha sido marcado como `PAID`, os eventos subsequentes são ignorados de forma idempotente para evitar duplicação de ingressos e decremento indevido de vagas do evento.
- No momento da confirmação do webhook:
  1. A transação do banco decrementa 1 vaga em `availableSpots`.
  2. Altera o status da inscrição para `CONFIRMED`.
  3. Gera um código único de ingresso `ACTIVE`.
  4. Caso o evento esteja lotado (sem vagas), a transação é revertida com erro `NO_AVAILABLE_SPOTS` no log do webhook e o pagamento permanece como `PAID` para tratamento administrativo manual.

### 3. Cartão de Crédito
- A cobrança direta com cartão de crédito via API não é realizada nesta etapa para evitar coleta de dados sensíveis crus no backend do TechSonar.
- A tokenização de cartão será implementada futuramente. O endpoint responderá com erro de `NotImplementedException`.
