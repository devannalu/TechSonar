# TechSonar

Aplicativo mobile para gerenciamento de eventos de tecnologia, conectando participantes e organizadores.

## Stack Oficial

| Camada         | Tecnologia                  |
| -------------- | --------------------------- |
| Mobile         | Flutter + Dart              |
| API            | NestJS + TypeScript         |
| Banco de Dados | PostgreSQL                  |
| ORM            | Prisma                      |
| Pagamentos     | Pagar.me                    |
| Notificações   | Firebase Cloud Messaging    |

## Estrutura do Monorepo

```txt
techsonar/
  legacy-prototype/   # Protótipo antigo (somente referência)
  apps/
    mobile/            # App Flutter (aplicação real)
  services/
    api/               # API NestJS (aplicação real)
  packages/
    shared/            # Código compartilhado futuro
  docs/
    product/           # Documentação de produto
    technical/         # Documentação técnica
    legal/             # Documentação jurídica
```

## Legacy Prototype

O diretório `legacy-prototype/` guarda o protótipo antigo do TechSonar apenas como referência histórica, visual e conceitual.

A nova aplicação será construída do zero em `apps/mobile/` e `services/api/`.

Nenhum código do protótipo deve ser modificado, refatorado ou usado diretamente na aplicação real. As únicas partes reaproveitadas serão as decisões de produto, regras de negócio e fluxos validados.

## Decisão de Perfil Organizador

Todo evento publicado no TechSonar precisa estar vinculado a um **Perfil Organizador**.

O Perfil Organizador é a entidade responsável por publicar e gerenciar eventos. Comunidade **não** é a entidade principal obrigatória — é apenas um dos tipos possíveis.

### Tipos de Perfil Organizador

- Comunidade
- Empresa
- Universidade
- Faculdade
- Instituição
- Coletivo
- Organizador Independente
- Outro

## Módulos Futuros

- Autenticação e autorização
- Perfil de usuário
- Perfil Organizador (criação, gestão, permissões)
- Eventos (criação, publicação, detalhes)
- Inscrições e ingressos
- Pagamentos via Pagar.me
- Check-in via QR Code
- Feedback pós-evento
- Certificados
- Notificações push via FCM
- Métricas e relatórios
- Painel administrativo

## Próximos Passos

1. Criar estrutura do monorepo
2. Criar documentação inicial
3. Criar base da API NestJS em `services/api`
4. Configurar PostgreSQL e Prisma
5. Modelar banco de dados inicial
6. Criar autenticação
7. Criar Perfil Organizador
8. Criar eventos
9. Criar inscrições
10. Criar base do app Flutter em `apps/mobile`
11. Integrar app com API
12. Integrar pagamentos com Pagar.me
13. Implementar check-in
14. Implementar feedback
15. Implementar certificados
16. Implementar notificações
