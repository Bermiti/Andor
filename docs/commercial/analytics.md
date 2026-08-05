# Contrato de analytics

## Estado real

Existe um buffer client-side em memória (`window.andor_events`) e um evento de browser (`andor-telemetry`). Não existe fornecedor externo, persistência, consent manager, identidade entre sessões, dashboard ou alertas.

Os call sites atuais usam eventos legados e incompletos, incluindo `page_view`, `itinerary_generated`, `favorite_added`, `favorite_removed`, `itinerary_duplicated`, `ai_concierge_opened` e `custom_request_submitted`. Isto não equivale ao funil obrigatório abaixo. A migração deve ser feita por fluxo, com testes, e só depois o evento pode ser marcado como implementado.

## Convenções

- nomes em `snake_case`, no passado, centrados no resultado observável;
- `schema_version: 1` quando a instrumentação canónica começar;
- propriedades enumeradas ou agregadas, não texto livre;
- conclusão só depois da resposta/persistência que prova o resultado;
- falha inclui um `error_code` estável, nunca a mensagem interna;
- um evento não prova causalidade nem receita sem reconciliação.

## Funil canónico

| Evento | Momento exato | Propriedades permitidas | Estado |
| --- | --- | --- | --- |
| `homepage_viewed` | Uma vez por carregamento da homepage | `entry_point`, `locale`, `schema_version` | Planeado |
| `registration_started` | Modal/formulário iniciado por ação do utilizador | `method`, `entry_point`, `schema_version` | Planeado |
| `registration_completed` | Sessão e perfil confirmados | `method`, `schema_version` | Planeado |
| `trip_creation_started` | Primeiro passo aberto | `entry_point`, `has_account`, `schema_version` | Planeado |
| `trip_creation_step_abandoned` | Saída do wizard após interação, uma vez por sessão/etapa | `step_key`, `exit_reason`, `elapsed_band`, `schema_version` | Planeado |
| `itinerary_generation_completed` | Itinerário válido e persistido, ou rascunho local explicitamente classificado | `generation_mode`, `destination_kind`, `trip_length_days`, `traveler_band`, `schema_version` | Legado parcial como `itinerary_generated` |
| `itinerary_generation_failed` | Pipeline termina sem resultado utilizável | `stage`, `error_code`, `retryable`, `schema_version` | Planeado |
| `itinerary_first_edited` | Primeira alteração persistida nessa viagem | `edit_type`, `days_after_creation_band`, `schema_version` | Planeado |
| `recommendation_added` | Recomendação persistida num período do itinerário | `recommendation_category`, `period`, `source_type`, `schema_version` | Planeado |
| `trip_shared` | Link/partilha criado com sucesso | `share_method`, `access_level`, `schema_version` | Planeado |
| `affiliate_link_clicked` | Clique num link rotulado como afiliado | `partner_key`, `category`, `placement`, `schema_version` | Planeado; não há programa afiliado ativo |
| `trip_invitation_sent` | Convite persistido e entrega aceite pelo fornecedor | `role`, `channel`, `schema_version` | Planeado; envio de email ausente |
| `user_returned` | Nova sessão elegível depois da janela acordada | `return_window`, `entry_page`, `schema_version` | Planeado; identidade/consentimento ausentes |

## Propriedades que não devem ser recolhidas

- email, nome, telefone, morada ou texto livre;
- token OAuth, código de convite, segredo ou query parameters;
- URL completa ou referrer completo;
- coordenadas precisas e localização atual;
- datas exatas de viagem quando uma banda relativa é suficiente;
- prompts, notas, restrições médicas/alimentares ou mensagens do assistente;
- IDs de fornecedor que permitam reidentificação sem necessidade documentada.

O buffer atual remove chaves sensíveis comuns, descarta objetos aninhados, limita strings/arrays, transforma rotas privadas em templates sem identificadores e guarda apenas o hostname do referrer. Isto é defesa em profundidade, não substitui revisão de cada call site.

## Consentimento e governação

Até existir decisão formal, o buffer não deve ser ligado a um endpoint ou SDK externo. Antes disso, documentar:

- finalidade de cada evento e base legal/consentimento;
- fornecedor, região, subprocessadores e DPA;
- cookies/local storage utilizados pelo SDK;
- retenção e processo de eliminação/exportação;
- acesso interno por função;
- exclusão de ambientes de desenvolvimento e tráfego interno;
- versão do contrato e owner de cada evento.

## Métricas derivadas

- **Ativação** = utilizadores elegíveis com `itinerary_generation_completed` / utilizadores elegíveis com `trip_creation_started`.
- **Erro de geração** = tentativas com `itinerary_generation_failed` / todas as tentativas terminadas.
- **Primeira edição** = viagens com `itinerary_first_edited` / viagens persistidas.
- **Partilha** = viagens com `trip_shared` / viagens persistidas.
- **Retorno** = utilizadores consentidos com `user_returned` / coorte elegível.

Cada dashboard deve mostrar período, timezone, denominador, filtros, versão de schema e ambientes incluídos. Metas só devem ser definidas após uma baseline real.

## Checklist de implementação por evento

1. Trigger associado a uma transição real de produto.
2. Propriedades no contrato e sem PII.
3. Deduplicação/idempotência definida.
4. Teste unitário ou E2E que prova sucesso e ausência em falha.
5. Validação no ambiente de staging.
6. Consentimento e retenção aplicados no adapter do fornecedor.
7. Owner e dashboard definidos.
