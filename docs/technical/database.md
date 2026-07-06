# Banco de Dados

Modelagem e entidades do banco de dados do TechSonar.

## Tecnologia

- **Banco:** PostgreSQL
- **ORM:** Prisma

## Modelagem Inicial

Esta primeira modelagem representa o núcleo do produto TechSonar, com todas as entidades principais e relacionamentos estruturados no Prisma.

## Entidades Principais

| Entidade                 | Descrição                                      |
| ------------------------ | ---------------------------------------------- |
| `User`                   | Usuários do sistema                            |
| `UserProfile`            | Perfis de usuário (dados adicionais e configs) |
| `OrganizerProfile`       | Perfis Organizadores                           |
| `OrganizerMember`        | Membros de um Perfil Organizador               |
| `Event`                  | Eventos publicados                             |
| `Registration`           | Inscrições em eventos                          |
| `Ticket`                 | Ingressos gerados                              |
| `Payment`                | Pagamentos realizados                          |
| `PaymentWebhookLog`      | Logs de webhooks do gateway de pagamento       |
| `Coupon`                 | Cupons de desconto                             |
| `Checkin`                | Check-ins realizados                           |
| `Feedback`               | Feedbacks dos participantes                    |
| `Certificate`            | Certificados emitidos                          |
| `Notification`           | Notificações enviadas                          |
| `AuditLog`               | Logs de auditoria                              |
