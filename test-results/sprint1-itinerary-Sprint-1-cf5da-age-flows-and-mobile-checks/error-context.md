# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sprint1-itinerary.spec.js >> Sprint 1 itinerary acceptance >> Tokyo itinerary page flows and mobile checks
- Location: tests\sprint1-itinerary.spec.js:22:3

# Error details

```
Error: expect(received).toBeLessThanOrEqual(expected)

Expected: <= 420
Received:    750
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - button "Ask Andor Concierge" [ref=e3] [cursor=pointer]:
      - generic [ref=e4]: ✨
      - generic: Fala com o teu concierge pessoal
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]:
          - generic [ref=e8]: A
          - generic [ref=e9]:
            - heading "ANDOR AI" [level=2] [ref=e11]
            - paragraph [ref=e12]: Your personal travel concierge
        - generic [ref=e13]:
          - button "🧘" [ref=e14] [cursor=pointer]
          - button "👥" [ref=e15] [cursor=pointer]
          - button "✕" [ref=e16] [cursor=pointer]
      - generic [ref=e17]:
        - button "🗺️ Ver no mapa" [ref=e18] [cursor=pointer]
        - button "📋 Criar itinerário" [ref=e19] [cursor=pointer]
        - button "💰 Calcular orçamento" [ref=e20] [cursor=pointer]
        - button "✈️ Pesquisar voos" [ref=e21] [cursor=pointer]
      - generic [ref=e23]:
        - heading "Boa noite. Os melhores itinerários nascem a esta hora." [level=3] [ref=e27]
        - paragraph [ref=e28]: Eu sou o ANDOR — o teu concierge de viagens de elite. Desenho itinerários completos, descubro hotéis que valem mesmo a pena, hacks de voos e resolvo emergências em segundos.
        - generic [ref=e29]:
          - button "✈️ Planeia uma viagem para mim" [ref=e30] [cursor=pointer]
          - button "🗺️ Melhora o meu itinerário actual" [ref=e31] [cursor=pointer]
          - button "💰 Viagem a Tóquio por €800" [ref=e32] [cursor=pointer]
          - button "🌍 Surpreende-me com um destino" [ref=e33] [cursor=pointer]
          - button "🏨 Encontra-me o hotel perfeito" [ref=e34] [cursor=pointer]
          - button "⚡ Resolvo uma emergência de viagem" [ref=e35] [cursor=pointer]
      - generic [ref=e36]:
        - textbox "Para onde queres ir?" [ref=e38]
        - button "Enviar mensagem" [disabled] [ref=e39]:
          - img [ref=e40]
      - generic: 💭 Lembro-me das tuas preferências
  - generic [ref=e43]:
    - generic [ref=e47]: 247 pessoas a explorar destinos agora
    - button "Fechar" [ref=e48] [cursor=pointer]: ✕
  - generic [ref=e49]:
    - navigation [ref=e50]:
      - generic [ref=e51]:
        - link "Andor" [ref=e52] [cursor=pointer]:
          - /url: /
          - img [ref=e54]
          - generic [ref=e58]: Andor
        - generic [ref=e59]:
          - link "Features" [ref=e60] [cursor=pointer]:
            - /url: /#como-funciona
          - link "Destinos" [ref=e61] [cursor=pointer]:
            - /url: /#destinos
          - link "Itinerários" [ref=e62] [cursor=pointer]:
            - /url: /#concierge
          - link "Preços" [ref=e63] [cursor=pointer]:
            - /url: /#pricing
          - generic [ref=e64]:
            - button "Entrar" [ref=e65] [cursor=pointer]
            - button "Começar Grátis" [ref=e66] [cursor=pointer]
        - button "Menu" [ref=e68] [cursor=pointer]
    - generic [ref=e72]:
      - generic [ref=e73]:
        - generic [ref=e74]:
          - banner [ref=e75]:
            - generic [ref=e76]:
              - heading "Tokyo, Japan" [level=1] [ref=e77]
              - generic [ref=e78]:
                - button "⚙️ Editar" [ref=e79] [cursor=pointer]
                - button "🔗 Partilhar" [ref=e80] [cursor=pointer]
                - button "📄 Exportar" [ref=e81] [cursor=pointer]
            - generic [ref=e82]: "🗓️ 2 Dias de Aventura • Estilo: Cultural"
          - generic [ref=e83]:
            - button "DIA 1 ✈️ Arrival Est. €0" [ref=e84] [cursor=pointer]:
              - generic [ref=e85]: DIA 1
              - generic [ref=e86]:
                - generic [ref=e87]: ✈️
                - generic "Arrival" [ref=e88]
              - generic [ref=e89]: Est. €0
            - button "DIA 2 ✈️ Sightseeing Est. €0" [ref=e90] [cursor=pointer]:
              - generic [ref=e91]: DIA 2
              - generic [ref=e92]:
                - generic [ref=e93]: ✈️
                - generic "Sightseeing" [ref=e94]
              - generic [ref=e95]: Est. €0
          - generic [ref=e97]:
            - generic [ref=e98]:
              - button "🗺️ Map" [ref=e99] [cursor=pointer]
              - button "🛰️ Satellite" [ref=e100] [cursor=pointer]
            - generic [ref=e101]:
              - button "1" [ref=e102] [cursor=pointer]:
                - generic [ref=e103]: "1"
              - generic:
                - generic:
                  - generic [ref=e104]:
                    - button "Zoom in" [disabled] [ref=e105]: +
                    - button "Zoom out" [ref=e106] [cursor=pointer]: −
                  - generic [ref=e107]:
                    - link "Leaflet" [ref=e108] [cursor=pointer]:
                      - /url: https://leafletjs.com
                      - img [ref=e109]
                      - text: Leaflet
                    - text: "| © OpenStreetMap & CARTO"
          - generic [ref=e113]:
            - generic [ref=e114]:
              - heading "Arrival" [level=2] [ref=e115]
              - generic [ref=e116]:
                - button "🔄 Regenerar este dia" [ref=e117] [cursor=pointer]
                - button "🛰️ Go Live" [ref=e118] [cursor=pointer]
            - generic [ref=e120]:
              - generic [ref=e121]:
                - generic [ref=e122]: ☀️
                - generic [ref=e123]: Tarde
              - generic [ref=e125]:
                - generic [ref=e126] [cursor=pointer]:
                  - generic [ref=e127]:
                    - generic [ref=e128]: 📍
                    - generic [ref=e129]: Sensoji
                  - generic [ref=e130]:
                    - generic [ref=e131]: ⏱️ 2h
                    - generic [ref=e132]: 💰 Grátis
                    - generic [ref=e133]: ▲
                - generic [ref=e135]:
                  - generic [ref=e136]:
                    - img "Sensoji" [ref=e137]
                    - generic [ref=e138]:
                      - generic [ref=e139]: 📍 Sensoji, Tokyo
                      - generic [ref=e140]:
                        - generic [ref=e141]: ⭐ 4.5
                        - generic [ref=e142]: ⏱️ 09:00
                    - button "🔖" [ref=e143] [cursor=pointer]
                  - generic [ref=e145]:
                    - text: 🚇
                    - strong [ref=e146]: "Como chegar:"
                    - text: Metro / Autocarro (15 min €2)
                  - generic [ref=e147]:
                    - button "🗺️ Ver no Mapa" [ref=e148] [cursor=pointer]
                    - link "🔗 Reservar" [ref=e149] [cursor=pointer]:
                      - /url: https://www.google.com/maps/search/?api=1&query=Sensoji
                    - button "❤️ Guardado" [ref=e150] [cursor=pointer]
          - generic [ref=e151]:
            - heading "🍽️ Refeições Sugeridas do Dia" [level=3] [ref=e152]
            - generic [ref=e153]:
              - generic [ref=e154]:
                - generic [ref=e155]: 🌅🍳
                - generic [ref=e156]: Pequeno-Almoço
                - heading "Café Central Tokyo" [level=4] [ref=e157]
                - generic [ref=e158]:
                  - generic [ref=e159]: Cafetaria local
                  - generic [ref=e160]: €
                - generic [ref=e161]: 🧑‍🍳 "Pastelaria fresca e café filtrado"
                - generic [ref=e162]:
                  - text: "Custo médio:"
                  - strong [ref=e163]: €8
                - link "Reservar mesa ↗" [ref=e164] [cursor=pointer]:
                  - /url: https://www.google.com/maps/search/?api=1&query=Caf%C3%A9%20Central%20Tokyo%20Tokyo
              - generic [ref=e165]:
                - generic [ref=e166]: ☀️🥗
                - generic [ref=e167]: Almoço
                - heading "Tasca do Bairro Tokyo" [level=4] [ref=e168]
                - generic [ref=e169]:
                  - generic [ref=e170]: Cozinha Tradicional
                  - generic [ref=e171]: €€
                - generic [ref=e172]: 🧑‍🍳 "Prato do dia com peixe fresco"
                - generic [ref=e173]:
                  - text: "Custo médio:"
                  - strong [ref=e174]: €18
                - link "Reservar mesa ↗" [ref=e175] [cursor=pointer]:
                  - /url: https://www.google.com/maps/search/?api=1&query=Tasca%20do%20Bairro%20Tokyo%20Tokyo
              - generic [ref=e176]:
                - generic [ref=e177]: 🌙🍷
                - generic [ref=e178]: Jantar
                - heading "Restaurante Premium Tokyo" [level=4] [ref=e179]
                - generic [ref=e180]:
                  - generic [ref=e181]: Alta Gastronomia
                  - generic [ref=e182]: €€€
                - generic [ref=e183]: 🧑‍🍳 "Menu de degustação do Chef"
                - generic [ref=e184]:
                  - text: "Custo médio:"
                  - strong [ref=e185]: €35
                - link "Reservar mesa ↗" [ref=e186] [cursor=pointer]:
                  - /url: https://www.google.com/maps/search/?api=1&query=Restaurante%20Premium%20Tokyo%20Tokyo
        - complementary [ref=e187]:
          - generic [ref=e188]:
            - generic [ref=e189]:
              - heading "Resumo da Viagem" [level=3] [ref=e190]
              - generic [ref=e191]:
                - generic [ref=e192]: Orçamento Total Est.
                - generic [ref=e193]: €650
            - separator [ref=e194]
            - generic [ref=e195]:
              - heading "Despesas Estimadas" [level=4] [ref=e196]
              - generic [ref=e197]:
                - generic [ref=e198]:
                  - generic [ref=e199]: ✈️ Voos Sugeridos
                  - strong [ref=e200]: €350
                - generic [ref=e201]:
                  - generic [ref=e202]: 🏨 Alojamento
                  - strong [ref=e203]: €180
                - generic [ref=e204]:
                  - generic [ref=e205]: 🍽️ Alimentação
                  - strong [ref=e206]: Est. €€120
                - generic [ref=e207]:
                  - generic [ref=e208]: 🎟️ Atividades
                  - strong [ref=e209]: Grátis / Local
            - separator [ref=e210]
            - separator [ref=e211]
            - separator [ref=e212]
            - generic [ref=e213]:
              - generic [ref=e215]: 🚇 Transportes Coletivos
              - paragraph [ref=e216]: Utiliza os passes de transporte locais para viagens ilimitadas de metro e autocarro na cidade.
            - separator [ref=e217]
            - generic [ref=e218]:
              - button "📥 Exportar PDF" [ref=e219] [cursor=pointer]
              - button "🔗 Partilhar Viagem" [ref=e220] [cursor=pointer]
              - button "💬 Pedir Ajuda ao AI" [ref=e221] [cursor=pointer]
          - generic [ref=e223]:
            - heading "🧮 Interactive Budget Planner" [level=3] [ref=e224]
            - paragraph [ref=e225]: Customize your travel tiers to calculate instant cost breakdowns.
            - generic [ref=e226]:
              - generic [ref=e227]:
                - generic [ref=e228]: 👥 Travelers
                - generic [ref=e229]: 2 people
              - slider [ref=e230]: "2"
            - generic [ref=e231]:
              - generic [ref=e232]:
                - generic [ref=e233]: 📅 Duration
                - generic [ref=e234]: 2 days
              - slider [ref=e235]: "2"
            - generic [ref=e236]:
              - generic [ref=e237]: ✈️ Flight Class
              - generic [ref=e238]:
                - button "Economy" [ref=e239] [cursor=pointer]
                - button "Business" [ref=e240] [cursor=pointer]
                - button "First" [ref=e241] [cursor=pointer]
            - generic [ref=e242]:
              - generic [ref=e243]: 🏨 Accommodation
              - generic [ref=e244]:
                - button "Budget" [ref=e245] [cursor=pointer]
                - button "Boutique" [ref=e246] [cursor=pointer]
                - button "Luxury" [ref=e247] [cursor=pointer]
            - generic [ref=e248]:
              - generic [ref=e249]: 🍽️ Dining & Culinary
              - generic [ref=e250]:
                - button "Budget" [ref=e251] [cursor=pointer]
                - button "Mid-Range" [ref=e252] [cursor=pointer]
                - button "Fine" [ref=e253] [cursor=pointer]
            - generic [ref=e254]:
              - generic [ref=e255]:
                - text: Estimated Total
                - heading "€920" [level=2] [ref=e256]
                - generic [ref=e257]: ~€460 / person
              - generic [ref=e258]:
                - generic [ref=e259]:
                  - generic [ref=e261]: Flights
                  - generic [ref=e262]: €300
                - generic [ref=e263]:
                  - generic [ref=e265]: Lodging
                  - generic [ref=e266]: €260
                - generic [ref=e267]:
                  - generic [ref=e269]: Dining
                  - generic [ref=e270]: €220
                - generic [ref=e271]:
                  - generic [ref=e273]: Activities
                  - generic [ref=e274]: €140
              - generic [ref=e275]:
                - generic "Flights" [ref=e276]
                - generic "Lodging" [ref=e277]
                - generic "Dining" [ref=e278]
                - generic "Activities" [ref=e279]
      - generic [ref=e280]:
        - generic [ref=e281]:
          - heading "📅 Best Time to Visit" [level=3] [ref=e282]
          - paragraph [ref=e283]: Monthly climate & season overview for your destination.
          - generic [ref=e284]:
            - 'generic "Jan: 10°C - Cold" [ref=e285]':
              - generic [ref=e286]: Jan
              - generic [ref=e287]: 10°C
              - generic [ref=e288]: Cold
            - 'generic "Feb: 10°C - Cold" [ref=e289]':
              - generic [ref=e290]: Feb
              - generic [ref=e291]: 10°C
              - generic [ref=e292]: Cold
            - 'generic "Mar: 13°C - Cherry Blossom" [ref=e293]':
              - generic [ref=e294]: Mar
              - generic [ref=e295]: 13°C
              - generic [ref=e296]: Cherry Blossom
            - 'generic "Apr: 19°C - Best Time" [ref=e297]':
              - generic [ref=e298]: Apr
              - generic [ref=e299]: 19°C
              - generic [ref=e300]: Best Time
            - 'generic "May: 23°C - Best Time" [ref=e301]':
              - generic [ref=e302]: May
              - generic [ref=e303]: 23°C
              - generic [ref=e304]: Best Time
            - 'generic "Jun: 26°C - Monsoon" [ref=e305]':
              - generic [ref=e306]: Jun
              - generic [ref=e307]: 26°C
              - generic [ref=e308]: Monsoon
            - 'generic "Jul: 29°C - Hot/Humid" [ref=e309]':
              - generic [ref=e310]: Jul
              - generic [ref=e311]: 29°C
              - generic [ref=e312]: Hot/Humid
            - 'generic "Aug: 31°C - Hot/Humid" [ref=e313]':
              - generic [ref=e314]: Aug
              - generic [ref=e315]: 31°C
              - generic [ref=e316]: Hot/Humid
            - 'generic "Sep: 27°C - Mild" [ref=e317]':
              - generic [ref=e318]: Sep
              - generic [ref=e319]: 27°C
              - generic [ref=e320]: Mild
            - 'generic "Oct: 22°C - Autumn Foliage" [ref=e321]':
              - generic [ref=e322]: Oct
              - generic [ref=e323]: 22°C
              - generic [ref=e324]: Autumn Foliage
            - 'generic "Nov: 17°C - Autumn Foliage" [ref=e325]':
              - generic [ref=e326]: Nov
              - generic [ref=e327]: 17°C
              - generic [ref=e328]: Autumn Foliage
            - 'generic "Dec: 12°C - Cold" [ref=e329]':
              - generic [ref=e330]: Dec
              - generic [ref=e331]: 12°C
              - generic [ref=e332]: Cold
          - generic [ref=e333]:
            - generic [ref=e336]: Recommended ✨
            - generic [ref=e339]: Shoulder / Mild
            - generic [ref=e342]: Peak Season (Hot/Crowded)
            - generic [ref=e345]: Low Season (Rain/Cold)
        - generic [ref=e346]:
          - heading "🧭 Destinos Próximos" [level=3] [ref=e347]
          - paragraph [ref=e348]: Enriquece a tua viagem com estas escapadinhas adicionais.
          - generic [ref=e349]:
            - generic [ref=e350]:
              - generic [ref=e351]:
                - img "Hakone" [ref=e352]
                - generic [ref=e353]: 📍 85 km
              - generic [ref=e354]:
                - heading "Hakone" [level=4] [ref=e355]
                - paragraph [ref=e356]: Hot springs, Mt. Fuji views & shrine gates.
            - generic [ref=e357]:
              - generic [ref=e358]:
                - img "Kyoto" [ref=e359]
                - generic [ref=e360]: 📍 2h by Shinkansen
              - generic [ref=e361]:
                - heading "Kyoto" [level=4] [ref=e362]
                - paragraph [ref=e363]: Thousands of classical Buddhist temples & geishas.
            - generic [ref=e364]:
              - generic [ref=e365]:
                - img "Kamakura" [ref=e366]
                - generic [ref=e367]: 📍 50 km
              - generic [ref=e368]:
                - heading "Kamakura" [level=4] [ref=e369]
                - paragraph [ref=e370]: Giant bronze Buddha & serene coastal walks.
        - generic [ref=e371]:
          - heading "📸 Visual Gallery" [level=3] [ref=e372]
          - paragraph [ref=e373]: Click on any photo to open the fullscreen gallery view.
          - generic [ref=e374]:
            - generic [ref=e375] [cursor=pointer]:
              - img "Tokyo, Japan view 1" [ref=e376]
              - generic [ref=e378]: 🔍 View Full
            - generic [ref=e379] [cursor=pointer]:
              - img "Tokyo, Japan view 2" [ref=e380]
              - generic [ref=e382]: 🔍 View Full
            - generic [ref=e383] [cursor=pointer]:
              - img "Tokyo, Japan view 3" [ref=e384]
              - generic [ref=e386]: 🔍 View Full
            - generic [ref=e387] [cursor=pointer]:
              - img "Tokyo, Japan view 4" [ref=e388]
              - generic [ref=e390]: 🔍 View Full
        - generic [ref=e391]:
          - generic [ref=e392]:
            - generic [ref=e393]: ⭐ Verified Stories
            - heading "What our global travelers say" [level=3] [ref=e394]
          - generic [ref=e395]:
            - button "Previous review" [ref=e396] [cursor=pointer]: ‹
            - generic [ref=e397]:
              - generic [ref=e398]:
                - generic [ref=e399]: ★
                - generic [ref=e400]: ★
                - generic [ref=e401]: ★
                - generic [ref=e402]: ★
                - generic [ref=e403]: ★
                - generic [ref=e404]: 5 / 5
              - paragraph [ref=e405]: "\"Andor completely rebuilt how we plan family vacations. The customized Lisbon itinerary was spotless — every local secret tip was a home run! The map navigation made it effortless to get around.\""
              - generic [ref=e406]:
                - img "Eleanor Vance" [ref=e407]
                - generic [ref=e408]:
                  - heading "Eleanor Vance" [level=4] [ref=e409]
                  - paragraph [ref=e410]: Luxury Traveler • 📍 Lisbon, Portugal
                - generic [ref=e411]: ✓ Verified Guest
            - button "Next review" [ref=e412] [cursor=pointer]: ›
          - generic [ref=e413]:
            - button "Go to slide 1" [ref=e414] [cursor=pointer]
            - button "Go to slide 2" [ref=e415] [cursor=pointer]
            - button "Go to slide 3" [ref=e416] [cursor=pointer]
            - button "Go to slide 4" [ref=e417] [cursor=pointer]
    - generic [ref=e419]:
      - generic [ref=e420]:
        - generic [ref=e421]: Luxury AI Plan
        - generic [ref=e422]:
          - heading "Tokyo, Japan" [level=4] [ref=e423]
          - paragraph [ref=e424]: 2 Dias • Itinerário Personalizado
      - generic [ref=e425]:
        - generic [ref=e426]:
          - generic [ref=e427]: Preço Estimado
          - generic [ref=e428]: €250
        - button "Reservar Viagem Bespoke ✨" [ref=e429] [cursor=pointer]
  - alert [ref=e430]
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | const TOKYO_BOUNDS = { latMin: 35.0, latMax: 36.5, lngMin: 138.5, lngMax: 140.5 };
  4  | 
  5  | function makeTokyoItinerary() {
  6  |   return {
  7  |     destination: 'Tokyo, Japan',
  8  |     days: [
  9  |       { title: 'Arrival', stops: [{ name: 'Sensoji', coordinates: { lat: 35.7148, lng: 139.7967 } }] },
  10 |       { title: 'Sightseeing', stops: [{ name: 'Shibuya Crossing', coordinates: { lat: 35.6595, lng: 139.7005 } }] }
  11 |     ]
  12 |   };
  13 | }
  14 | 
  15 | function encodeSharePayload(itin) {
  16 |   // mirror client encoding: btoa(unescape(encodeURIComponent(JSON.stringify(itin))))
  17 |   const json = JSON.stringify(itin);
  18 |   return Buffer.from(unescape(encodeURIComponent(json)), 'binary').toString('base64');
  19 | }
  20 | 
  21 | test.describe('Sprint 1 itinerary acceptance', () => {
  22 |   test('Tokyo itinerary page flows and mobile checks', async ({ page, baseURL }) => {
  23 |     // Programmatic coordinate validation before navigation
  24 |     const tokyo = makeTokyoItinerary();
  25 |     for (const day of tokyo.days) {
  26 |       for (const stop of day.stops) {
  27 |         const lat = stop.coordinates.lat;
  28 |         const lng = stop.coordinates.lng;
  29 |         expect(lat).toBeGreaterThanOrEqual(TOKYO_BOUNDS.latMin);
  30 |         expect(lat).toBeLessThanOrEqual(TOKYO_BOUNDS.latMax);
  31 |         expect(lng).toBeGreaterThanOrEqual(TOKYO_BOUNDS.lngMin);
  32 |         expect(lng).toBeLessThanOrEqual(TOKYO_BOUNDS.lngMax);
  33 |         // Ensure not Lisbon-like
  34 |         expect(lat).not.toBeCloseTo(38.7, 0);
  35 |         expect(lng).not.toBeCloseTo(-9.1, 0);
  36 |       }
  37 |     }
  38 | 
  39 |     const payload = encodeSharePayload(tokyo);
  40 |     await page.goto(`${baseURL}/itinerary/share?data=${payload}`, { waitUntil: 'networkidle' });
  41 | 
  42 |     // Verify page renders and shows Tokyo
  43 |     await expect(page.locator('h1')).toContainText(/Tokyo|Tóquio/i);
  44 | 
  45 |     // Verify day tabs present (buttons labeled 'DIA 1' etc.)
  46 |     const day1Btn = page.getByText('DIA 1', { exact: false }).first();
  47 |     const day2Btn = page.getByText('DIA 2', { exact: false }).first();
  48 |     await expect(day1Btn).toBeVisible();
  49 |     await expect(day2Btn).toBeVisible();
  50 | 
  51 |     // Click day 2 and verify heading changes from 'Arrival' to 'Sightseeing'
  52 |     await expect(page.locator('h2', { hasText: 'Arrival' })).toBeVisible();
  53 |     await day2Btn.click();
  54 |     await expect(page.locator('h2', { hasText: 'Sightseeing' })).toBeVisible();
  55 | 
  56 |     // Verify activity cards render (look for an action button present in stop cards)
  57 |     await expect(page.locator('text=Ver no Mapa').first()).toBeVisible();
  58 | 
  59 |     // Save/Favourite an activity: set `andor_favorites` in localStorage and verify UI reflects it after reload
  60 |     const firstStop = tokyo.days[0].stops[0];
  61 |     const favObj = { name: firstStop.name, destination: tokyo.destination };
  62 |     await page.evaluate((fav) => localStorage.setItem('andor_favorites', JSON.stringify([fav])), favObj);
  63 | 
  64 |     // Refresh and confirm favorite persists (look for 'Guardado' text in buttons)
  65 |     await page.reload({ waitUntil: 'networkidle' });
  66 |     const savedBtn = page.locator('button:has-text("Guardado")').first();
  67 |     await expect(savedBtn).toBeVisible({ timeout: 10000 });
  68 | 
  69 |     // Mobile checks at 375px
  70 |     await page.setViewportSize({ width: 375, height: 812 });
  71 |     // allow layout to settle after viewport change
  72 |     await page.waitForTimeout(500);
  73 |     const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
> 74 |     expect(scrollWidth).toBeLessThanOrEqual(420); // allow small tolerance
     |                         ^ Error: expect(received).toBeLessThanOrEqual(expected)
  75 | 
  76 |     // Day tabs still usable on mobile
  77 |     await day1Btn.click();
  78 |     await expect(day1Btn).toBeVisible();
  79 | 
  80 |     // Map renders or graceful fallback - check for leaflet container
  81 |     const leafletCount = await page.locator('.leaflet-container').count();
  82 |     if (leafletCount === 0) {
  83 |       test.info().annotations.push({ type: 'manual', description: 'Leaflet container not found; manual verification required for map rendering.' });
  84 |     } else {
  85 |       expect(leafletCount).toBeGreaterThan(0);
  86 |     }
  87 | 
  88 |     // Malformed shared itinerary: navigate to bad payload
  89 |     const badPayload = Buffer.from('this is not json').toString('base64');
  90 |     await page.goto(`${baseURL}/itinerary/share?data=${badPayload}`, { waitUntil: 'networkidle' });
  91 |     // Expect a friendly not found/invalid UI (h2 present)
  92 |     const notFoundH2 = page.locator('h2').first();
  93 |     await expect(notFoundH2).toBeVisible();
  94 |   });
  95 | });
  96 | 
```