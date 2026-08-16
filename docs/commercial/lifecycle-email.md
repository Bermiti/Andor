# Lifecycle e emails

## Estado de implementação

`app/lib/server/transactional-email-templates.js` gera HTML responsivo e texto simples para oito situações: verificação, boas-vindas, recuperação de palavra-passe, viagem criada, convite de grupo, alteração importante, viagem próxima e feedback. Os templates escapam texto dinâmico e rejeitam links com protocolos inseguros.

Não existe fornecedor de envio ligado, fila, scheduler, webhook de entrega, gestão de bounces, domínio de envio verificado ou sincronização de unsubscribe. Por isso, os fluxos abaixo estão **preparados, não ativos**. Os templates de autenticação podem ainda precisar de ser configurados no fornecedor de autenticação real.

## Classificação e consentimento

- **Transacional necessário**: verificação, recuperação e comunicações indispensáveis a uma ação pedida pelo utilizador. Limitar ao conteúdo operacional.
- **Produto/serviço**: viagem criada, convite e alteração importante. Enviar apenas ao participante relevante e de acordo com as preferências da conta.
- **Marketing/lifecycle**: boas-vindas promocionais, abandono, viagem próxima não essencial, inatividade, feedback e referral. Exigir consentimento válido nos mercados em que se aplica, unsubscribe em cada mensagem e lista de supressão.

A classificação final, base legal, retenção e wording precisam de revisão jurídica para os mercados de lançamento. Consentimento de newsletter não deve ser inferido de criação de conta ou aceitação de termos.

## Matriz de lifecycle

| Estado | Trigger proposto | Elegibilidade e proteção | Template/CTA | Estado |
| --- | --- | --- | --- | --- |
| Registado, sem viagem | 24 h após conta verificada | Opt-in de lifecycle; não tem viagem persistida; máximo 1 | `welcome` → iniciar planeamento | Preparado |
| Viagem iniciada e abandonada | 24 h após última etapa, sem geração persistida | Opt-in; excluir erro técnico ainda aberto; máximo 1 por rascunho | Template adicional a criar depois de existir rascunho persistido | Não implementado |
| Primeira viagem criada | Evento de persistência confirmado | Participante com acesso; idempotência por viagem/utilizador | `trip_created` → rever itinerário | Preparado |
| Viagem próxima | Janela a definir antes da data | Opt-in; timezone da viagem; não enviar se arquivada/cancelada | `trip_upcoming` → checklist | Preparado |
| Viagem terminada | Depois do fim no timezone local | Opt-in; uma vez por viagem; excluir viagem eliminada | `feedback_request` → questionário | Preparado |
| Utilizador inativo | Janela definida por coorte | Opt-in; frequência global; nunca expor destinos no assunto sem avaliação | Template a criar após definição de retenção | Não implementado |
| Convite não aceite | Antes da expiração | Preferência de lembrete do remetente; um lembrete; convite ainda válido | Variante de `group_invitation` | Parcial |
| Recomendação/partilha | Depois de valor demonstrado | Opt-in; não gerar convite sem ação explícita | Template a criar com referral real | Não implementado |

## Requisitos operacionais antes de ativar

1. Escolher fornecedor e região de dados; assinar DPA quando aplicável.
2. Verificar domínio de envio e configurar SPF, DKIM e DMARC.
3. Definir remetente e endereços de resposta monitorizados.
4. Implementar fila com idempotência por `template + recipient + business event`.
5. Processar delivery, bounce, complaint e unsubscribe por webhook autenticado.
6. Guardar versão e instante do consentimento, finalidade e origem; implementar revogação.
7. Separar preferências de produto das preferências de marketing.
8. Testar render em clientes principais, links, texto simples, acessibilidade e idiomas.
9. Aplicar frequência global e quiet hours pelo timezone do destinatário quando disponível.
10. Nunca incluir tokens, dados de reserva ou detalhes sensíveis em logs de eventos.

## Contrato de conteúdo

O renderer devolve `{ templateId, subject, preheader, html, text }` e não envia nada. Links de ação devem ser de uso único quando contêm credenciais e expirar no servidor. `unsubscribeUrl` só é anexado quando fornecido; é obrigatório para mensagens de marketing no futuro pipeline.

Exemplo de preparação, sem envio:

```js
renderTransactionalEmail('trip_created', {
  firstName: 'Rita',
  destination: 'São Miguel',
  itineraryUrl: 'https://andor.travels/itinerary/ID_AUTORIZADO',
});
```
