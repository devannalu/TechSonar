# Perfil Organizador

## Conceito

O Perfil Organizador é a entidade responsável por publicar e gerenciar eventos dentro do TechSonar.

Todo evento precisa pertencer a um Perfil Organizador.

## Tipos oficiais

- Comunidade
- Empresa
- Universidade
- Faculdade
- Instituição
- Coletivo
- Organizador Independente
- Outro

## Relação Conceitual

### User

- Pode criar um ou mais OrganizerProfiles
- Pode participar de eventos
- Pode fazer check-in
- Pode receber certificados

### OrganizerProfile

- Possui membros
- Possui permissões
- Publica eventos
- Gerencia inscrições
- Acessa métricas

### Event

- Pertence a um OrganizerProfile
- Possui inscrições
- Possui participantes
- Possui pagamentos
- Possui check-ins
- Possui feedbacks
- Possui certificados

## Regras de Negócio e Gestão

- **Criação**: Qualquer usuário ativo pode criar um Perfil Organizador. Ao criar, ele se torna automaticamente o `OWNER` do perfil.
- **Relação com Eventos**: Todo evento precisa estar vinculado a um Perfil Organizador. Não há eventos sem um perfil responsável.
- **Hierarquia de Papéis**:
  - `OWNER`: Dono do perfil, com controle total, incluindo exclusão do perfil.
  - `ADMIN`: Administrador, com controle de edição, gestão de eventos e membros (exceto exclusão do perfil).
  - Outros papéis adicionais (ex: `EVENT_MANAGER`, `CHECKIN_STAFF`) possuem permissões específicas limitadas.
