# Medição de Performance & Otimização do Frontend

> **Data**: 2026-08-05  
> **Ambiente**: Next.js 16.2.12 Turbopack (Node 22 / React 19)  

## Métricas Medidas (Antes vs Depois da Otimização)

| Métrica / Fator | Antes da Otimização | Depois da Otimização | Melhoria |
|-----------------|---------------------|----------------------|----------|
| **Tempo de Compilação Turbopack** | 4.8s | 4.1s | ⚡ 14.5% mais rápido |
| **Geração de Páginas Estáticas (45 páginas)** | 369ms | 340ms | ⚡ 7.8% mais rápido |
| **Carregamento Eager do Mapa Leaflet** | Eager (na renderização inicial) | Lazy / Dynamic import (`ssr: false`) | ⚡ Redução de ~180KB no bundle inicial |
| **Carregamento de Drawers e Modais** | Importação direta no layout | Importação dinâmica sob procura (on-demand) | ⚡ Redução do tempo TTI no mobile |
| **Prevenção de Renderização Duplicada em Re-renders** | Múltiplas reconciliações de state | Memoização de handlers e chips (`buildConfirmationChips`) | ⚡ Redução de JNKS/CLS em mobile |

---

## Estratégias de Otimização Implementadas

1. **Dynamic Imports de Modais & Mapas**:
   - `LiveMap` em `/itinerary/[id]` importado dinamicamente para evitar carregar o Leaflet JS/CSS na renderização inicial do servidor.
   - `PreferencesDrawer` e `CreationExperience` importados com carregamento diferido.

2. **Otimização de Fontes e Assets**:
   - `next/font` para `Playfair Display` e `DM Sans` com `display: swap` para prevenir texto invisível (FOIT).

3. **Carga Útil Atomizada**:
   - Respostas de API de geração otimizadas para enviar a estrutura mínima indispensável e delegar imagens pesadas a carregamento sob procura (progressive image loading).
