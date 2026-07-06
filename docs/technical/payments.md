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
