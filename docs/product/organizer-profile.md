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
