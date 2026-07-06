# Notificações

Documentação do sistema de notificações push do TechSonar.

## Tecnologia

As notificações push serão feitas com **Firebase Cloud Messaging**.

## Exemplos de Notificações

- Confirmação de inscrição
- Lembrete de evento
- Confirmação de presença
- Certificado liberado
- Evento alterado
- Evento cancelado

## Fluxo

1. Evento ocorre no backend (ex: inscrição confirmada)
2. API envia notificação via Firebase Cloud Messaging
3. FCM entrega push notification ao dispositivo do usuário
