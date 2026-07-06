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
25. O aplicativo mobile nunca deve se comunicar diretamente com o Pagar.me usando chaves privadas do gateway de pagamento. Toda comunicação deve passar pela API do TechSonar.
26. Os pagamentos gerados via Pix expiram em 30 minutos. Caso expirem, o participante deve gerar uma nova intenção de pagamento.
27. A confirmação do pagamento é realizada assincronamente através de um webhook exposto pela API do TechSonar.
28. Caso o evento seja esgotado no intervalo entre a geração do Pix e a recepção do webhook de pagamento, o pagamento permanece como pago (PAID) para conciliação administrativa e reembolso futuro, mas a inscrição não é confirmada e nenhum ingresso é gerado.
29. Todos os webhooks recebidos são persistidos para auditoria, e o processamento deles deve garantir idempotência.
30. O QR Code pertence ao evento, e não ao participante. O check-in valida a presença baseada no ID do evento em conjunto com a inscrição do usuário autenticado.
31. O check-in só é permitido se a inscrição do participante estiver no status CONFIRMED e se o ingresso (Ticket) correspondente estiver ACTIVE.
32. Check-ins não podem ser duplicados para a mesma inscrição.
33. Ao confirmar o check-in, em transação atômica do banco: o status da Registration muda para CHECKED_IN, o status do Ticket muda para USED, e o registro do Checkin é criado.
34. O check-in deve respeitar a janela de horário configurada no evento (entre `checkinStartsAt` e `checkinEndsAt`), caso esses campos estejam definidos.
35. Organizadores ativos do Perfil Organizador com os papéis de OWNER, ADMIN, EVENT_MANAGER ou CHECKIN_STAFF podem registrar check-in manual para qualquer participante do evento. Outros papéis não possuem permissão para check-in manual.
42. O envio de feedback só é permitido para participantes com inscrição no status CHECKED_IN (check-in já efetuado). Inscrições com outros status (ex. CONFIRMED, PENDING_PAYMENT) são bloqueadas.
43. Cada participante só pode enviar um único feedback por inscrição. O envio duplicado retorna erro de conflito (409).
44. O feedback enviado é persistido e associado à inscrição, evento e usuário para fins de auditoria e cálculo de métricas.
45. Qualquer membro ativo do Perfil Organizador possui permissão para visualizar a listagem e os dados consolidados das métricas de feedback dos eventos.
46. A consolidação das métricas de feedback do evento (como médias aritméticas e taxa de recomendação) é calculada dinamicamente com base nos feedbacks válidos.
47. O feedback pós-evento será um pré-requisito obrigatório para a liberação e emissão futura de certificados de participação.
