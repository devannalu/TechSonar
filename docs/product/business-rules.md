# Regras de Negócio

Regras de negócio oficiais do TechSonar.

## Regras

1. Todo evento deve estar vinculado a um Perfil Organizador.
2. Um Perfil Organizador pode publicar vários eventos.
3. Um usuário pode criar ou participar de um Perfil Organizador.
4. Um evento pode ser gratuito ou pago.
5. Um participante não pode se inscrever duas vezes no mesmo evento.
6. Um check-in só pode ser feito por participante inscrito.
7. O QR Code pertence ao evento, não ao participante.
8. O certificado só será liberado após inscrição confirmada, check-in realizado e feedback enviado.
9. O organizador pode gerenciar equipe e permissões.
10. Pagamentos devem ser processados pelo backend usando Pagar.me.
11. A chave secreta do Pagar.me nunca deve ficar no app mobile.
12. Notificações serão enviadas via Firebase Cloud Messaging.
13. O slug de um evento deve ser único dentro do mesmo Perfil Organizador.
14. Eventos do formato PRESENCIAL precisam obrigatoriamente de cidade, estado e local físico.
15. Eventos do formato ONLINE precisam obrigatoriamente de uma URL de transmissão ativa.
16. Eventos do formato HÍBRIDO precisam tanto de localização física quanto de URL de transmissão.
17. Se o evento for gratuito (isFree = true), o preço deve obrigatoriamente ser zero. Se possuir preço maior que zero, o evento é classificado como pago (isFree = false).
18. A exclusão de um evento é sempre lógica (preenchendo a data em `deletedAt` e alterando o status para `ARCHIVED`) para fins de preservação de histórico.
19. Apenas membros ativos do organizador com papéis de OWNER, ADMIN ou EVENT_MANAGER podem criar, editar ou publicar eventos. A exclusão ou cancelamento é restrito a OWNER e ADMIN.
20. Um participante não pode se inscrever mais de uma vez no mesmo evento (inscrições ativas/pendentes).
21. Para eventos gratuitos (isFree = true), a inscrição é criada como CONFIRMED, o ticket correspondente é gerado como ACTIVE e a vaga é deduzida de `availableSpots` imediatamente.
22. Para eventos pagos (isFree = false), a inscrição é criada como PENDING_PAYMENT. O ticket e a reserva permanente da vaga só são criados após a confirmação do pagamento.
23. O cancelamento de uma inscrição confirmada (CONFIRMED) invalida o ticket correspondente (CANCELED) e devolve a vaga aumentando `availableSpots` em 1 (caso o evento ainda não tenha iniciado).
24. As operações que envolvem alteração de vagas, tickets e status de inscrição devem ser executadas em transação de banco de dados para evitar inconsistências.
