# Analytics da Andor

O contrato canónico está em [`docs/commercial/analytics.md`](docs/commercial/analytics.md).

Estado atual, sem extrapolações:

- `app/lib/analytics.js` mantém no máximo 200 eventos apenas em memória, durante a página atual;
- não existe um fornecedor de analytics ligado, persistência, identificação entre sessões ou dashboard;
- o buffer remove propriedades com nomes sensíveis, ignora estruturas aninhadas e regista apenas o `pathname`, nunca query parameters ou URLs completos;
- os call sites existentes ainda usam uma taxonomia parcial e anterior ao contrato canónico;
- os eventos obrigatórios da Fase 9 estão definidos, mas só devem ser marcados como implementados depois de cada trigger ter um teste correspondente;
- qualquer envio para terceiros exige decisão de consentimento, retenção, localização de dados e contrato com o fornecedor.

Não usar `window.andor_events` como fonte de métricas de negócio: é apenas um mecanismo local de desenvolvimento e teste.
