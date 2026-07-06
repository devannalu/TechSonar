# Banco de Dados

Modelagem e entidades do banco de dados do TechSonar.

## Tecnologia

- **Banco:** PostgreSQL
- **ORM:** Prisma

## Entidades Futuras

| Entidade                 | Descrição                                      |
| ------------------------ | ---------------------------------------------- |
| `users`                  | Usuários do sistema                            |
| `user_profiles`          | Perfis de usuário                              |
| `organizer_profiles`     | Perfis Organizadores                           |
| `organizer_members`      | Membros de um Perfil Organizador               |
| `organizer_permissions`  | Permissões dentro de um Perfil Organizador     |
| `events`                 | Eventos publicados                             |
| `registrations`          | Inscrições em eventos                          |
| `tickets`                | Ingressos gerados                              |
| `payments`               | Pagamentos realizados                          |
| `payment_webhook_logs`   | Logs de webhooks do gateway de pagamento       |
| `coupons`                | Cupons de desconto                             |
| `checkins`               | Check-ins realizados                           |
| `feedbacks`              | Feedbacks dos participantes                    |
| `certificates`           | Certificados emitidos                          |
| `notifications`          | Notificações enviadas                          |
| `audit_logs`             | Logs de auditoria                              |

## Observação

A modelagem detalhada será feita com Prisma Schema quando o desenvolvimento da API iniciar.
