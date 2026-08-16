# Base comercial da Andor

## Estado real

A Andor está em pré-lançamento. O repositório contém um protótipo funcional de planeamento de viagens, mas não contém evidência verificável de clientes pagos, volume de utilizadores, parceiros, afiliados, cobertura mediática ou métricas de retenção. Também não existe checkout, fornecedor de envio de email ou plataforma de analytics configurada.

Esta área separa claramente materiais prontos para usar de hipóteses que ainda têm de ser validadas:

| Área | Artefacto | Estado |
| --- | --- | --- |
| Posicionamento | [`one-page.md`](one-page.md) | Pronto para entrevistas e pilotos; ICP e receita são hipóteses |
| Vendas e parcerias | [`partnerships-and-sales.md`](partnerships-and-sales.md) | Estruturas prontas; nenhum parceiro assumido |
| Lifecycle e email | [`lifecycle-email.md`](lifecycle-email.md) | Fluxos e templates preparados; envio não integrado |
| Analytics | [`analytics.md`](analytics.md) | Contrato definido; instrumentação do funil incompleta |
| Templates de email | `app/lib/server/transactional-email-templates.js` | Oito templates renderizáveis e testados; sem fornecedor de envio |

## Regra de evidência

Antes de publicar uma afirmação comercial, classificar a fonte:

- **medida**: evento de produto com definição estável e período indicado;
- **declarada**: resposta de entrevista ou questionário, com tamanho da amostra;
- **contratada**: acordo assinado e âmbito explícito;
- **hipótese**: ainda não validada e apresentada como tal.

Nunca converter metas em resultados. Campos sem dados reais devem aparecer como `[POR MEDIR]`, `[POR VALIDAR]` ou `[NÃO CONFIGURADO]` nos materiais internos e ser removidos de materiais públicos.

## Gates antes de aquisição paga

1. Confirmar que criação, persistência e recuperação de uma viagem funcionam no ambiente de produção.
2. Definir o evento de ativação e validar o funil com dados consentidos.
3. Publicar termos, privacidade e política de cookies revistos para os mercados alvo.
4. Configurar domínio e fornecedor de email, supressão, unsubscribe, SPF, DKIM e DMARC.
5. Testar uma proposta e um segmento através de entrevistas e uma coorte pequena.
6. Só então testar preço e canais pagos com orçamento limitado.
