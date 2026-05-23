'use client';

import { useState, useEffect, use } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { trackEvent } from '../../lib/analytics';
import styles from './destination.module.css';

const destinations = {
  tokyo: {
    slug: "tokyo",
    name: "Tokyo",
    country: "Japan",
    flag: "🇯🇵",
    coordinates: [35.6762, 139.6503],
    heroImage: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&q=75&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1570521462033-3015e76e7432?w=800&q=75&auto=format&fit=crop",
    ],
    tagline: "A metrópole que nunca para — e nunca decepciona",
    andorVerdict: "Tokyo é a única cidade do mundo onde podes comer de forma excepcional por €8, ter uma experiência Michelin por €300, e ambas são memoráveis por razões completamente diferentes.",
    bestMonths: [
      { month: "Janeiro", score: 60, note: "Frio mas sem multidões" },
      { month: "Fevereiro", score: 65, note: "Frio, Shinjuku Gyoen tranquilo" },
      { month: "Março", score: 95, note: "Cerejeiras começam no final" },
      { month: "Abril", score: 98, note: "Pico das cerejeiras — mágico" },
      { month: "Maio", score: 85, note: "Tempo agradável, verde novo" },
      { month: "Junho", score: 55, note: "Época das chuvas" },
      { month: "Julho", score: 40, note: "Calor e humidade intensos" },
      { month: "Agosto", score: 35, note: "O pior mês — evitar" },
      { month: "Setembro", score: 70, note: "Começa a melhorar" },
      { month: "Outubro", score: 92, note: "Outono dourado, excelente" },
      { month: "Novembro", score: 88, note: "Folhagem de outono" },
      { month: "Dezembro", score: 72, note: "Natal japonês, luzes bonitas" }
    ],
    highlights: [
      { name: "Senso-ji Temple", type: "Cultura", emoji: "🏛️", description: "O templo mais visitado do Japão — vai antes das 7h" },
      { name: "Shibuya Crossing", type: "Icónico", emoji: "🚦", description: "O cruzamento mais movimentado do mundo" },
      { name: "teamLab Planets", type: "Arte Digital", emoji: "🎨", description: "Experiência imersiva única — reserva 6-8 semanas antes" },
      { name: "Tsukiji Outer Market", type: "Gastronomia", emoji: "🍣", description: "Melhor sushi da vida às 7h da manhã" },
      { name: "Shinjuku Golden Gai", type: "Vida Nocturna", emoji: "🍺", description: "200+ micro-bares — cada um com a sua personalidade" },
      { name: "Meiji Shrine", type: "Natureza/Cultura", emoji: "⛩️", description: "Floresta sagrada no centro da cidade" }
    ],
    avoidList: [
      "Robot Restaurant — cara e decepcionante",
      "Restaurantes com fotos no menu em Shibuya — para turistas",
      "Táxi do aeroporto — custa 5x mais que o N'EX"
    ],
    budgetGuide: {
      backpacker: { perDay: 50, note: "Hostels, convenience store food, actividades gratuitas" },
      midRange: { perDay: 130, note: "Hotel 3-4★, mix restaurantes, algumas experiências" },
      luxury: { perDay: 400, note: "5★, restaurantes Michelin, experiências privadas" }
    },
    practicalInfo: {
      visa: "Visa-free EU/US, 90 dias",
      currency: "Yen (¥) — muito cash-based",
      language: "Japonês — inglês em zonas turísticas",
      transport: "Suica card — cobre tudo",
      plug: "Tipo A, 100V",
      safety: "Excepcional",
      tipping: "Nunca — é rude"
    },
    nearbyEscapes: [
      { name: "Kyoto", distance: "2h15 Shinkansen", cost: 70, note: "Completamente diferente — vale muito" },
      { name: "Hakone", distance: "1h30 comboio", cost: 25, note: "Monte Fuji + onsen" },
      { name: "Nara", distance: "45min de Kyoto", cost: 15, note: "Cervos livres nas ruas" }
    ],
    andorScore: 94
  },
  paris: {
    slug: "paris",
    name: "Paris",
    country: "France",
    flag: "🇫🇷",
    coordinates: [48.8566, 2.3522],
    heroImage: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600&q=75&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1499856871958-5b9647a6406a?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509067186669-87356e10411a?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=800&q=75&auto=format&fit=crop",
    ],
    tagline: "A cidade da luz, arte e romance intemporal",
    andorVerdict: "Paris é tão magnífica quanto dizem, mas o verdadeiro segredo é afastar-se das filas intermináveis e sentar-se num bistrô local com um bom vinho e baguete fresca.",
    bestMonths: [
      { month: "Janeiro", score: 45, note: "Frio e cinzento, mas voos baratos" },
      { month: "Fevereiro", score: 50, note: "Frio, ideal para museus" },
      { month: "Março", score: 70, note: "Início da primavera, instável" },
      { month: "Abril", score: 85, note: "Cerejeiras e jardins floridos" },
      { month: "Maio", score: 92, note: "Clima excelente, dias longos" },
      { month: "Junho", score: 95, note: "Melhor mês do ano" },
      { month: "Julho", score: 80, note: "Quente, muito concorrido" },
      { month: "Agosto", score: 60, note: "Muitas lojas fechadas por férias" },
      { month: "Setembro", score: 90, note: "Excelente outono (La Rentrée)" },
      { month: "Outubro", score: 80, note: "Cores de outono magníficas" },
      { month: "Novembro", score: 55, note: "Chuvoso e dias curtos" },
      { month: "Dezembro", score: 75, note: "Mercados de Natal, iluminação" }
    ],
    highlights: [
      { name: "Eiffel Tower", type: "Icónico", emoji: "🗼", description: "Vistas incríveis, suba a pé para evitar filas" },
      { name: "Louvre Museum", type: "Arte", emoji: "🎨", description: "Maior museu do mundo — compre online com antecedência" },
      { name: "Montmartre", type: "Cultura", emoji: "🎨", description: "Bairro boémio dos artistas, basílica de Sacré-Cœur" },
      { name: "Seine River Cruise", type: "Lazer", emoji: "🚢", description: "Passeio romântico ao pôr do sol" },
      { name: "Sainte-Chapelle", type: "História", emoji: "⛪", description: "Os vitrais mais deslumbrantes da Europa" },
      { name: "Le Marais", type: "Bairro", emoji: "🛍️", description: "Boutiques vintage, falafel delicioso e mansões históricas" }
    ],
    avoidList: [
      "Jantar na Champs-Élysées — extremamente caro e turístico",
      "Subir a Torre Eiffel sem reserva online prévia",
      "Táxis não oficiais na Gare du Nord"
    ],
    budgetGuide: {
      backpacker: { perDay: 65, note: "Hostels, refeições piquenique, passes de metro" },
      midRange: { perDay: 160, note: "Hotel de charme, almoço menu do dia, museus pagos" },
      luxury: { perDay: 500, note: "Palácios 5★, jantares Michelin, tours privados" }
    },
    practicalInfo: {
      visa: "Visa-free EU/US, parte de Schengen",
      currency: "Euro (€)",
      language: "Francês — inglês comum",
      transport: "Métro e RER com passe Navigo Easy",
      plug: "Tipo C e E, 230V",
      safety: "Atenção a carteiristas em zonas turísticas",
      tipping: "Arredondar conta é suficiente"
    },
    nearbyEscapes: [
      { name: "Versailles", distance: "40min comboio RER", cost: 8, note: "Palácio e jardins deslumbrantes" },
      { name: "Giverny", distance: "45min comboio", cost: 15, note: "Jardins e casa de Claude Monet" },
      { name: "Disneyland Paris", distance: "40min RER A", cost: 20, note: "Magia para miúdos e graúdos" }
    ],
    andorScore: 88
  },
  bali: {
    slug: "bali",
    name: "Bali",
    country: "Indonesia",
    flag: "🇮🇩",
    coordinates: [-8.4095, 115.1889],
    heroImage: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=75&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=800&q=75&auto=format&fit=crop",
    ],
    tagline: "A ilha dos deuses, templos e praias exuberantes",
    andorVerdict: "Bali tem um magnetismo único. Embora zonas como Canggu sejam ocidentalizadas, Ubud e o norte preservam uma espiritualidade autêntica.",
    bestMonths: [
      { month: "Janeiro", score: 50, note: "Época das chuvas forte" },
      { month: "Fevereiro", score: 55, note: "Humidade extrema, chuva" },
      { month: "Março", score: 70, note: "Fim das chuvas, Nyepi (dia do silêncio)" },
      { month: "Abril", score: 85, note: "Transição excelente, dias de sol" },
      { month: "Maio", score: 92, note: "Excelente tempo, pouca chuva" },
      { month: "Junho", score: 95, note: "Clima soberbo, época seca" },
      { month: "Julho", score: 95, note: "Clima ameno, época alta" },
      { month: "Agosto", score: 95, note: "Excelente vento, noites frescas" },
      { month: "Setembro", score: 90, note: "Ideal, menos confusão" },
      { month: "Outubro", score: 80, note: "Transição, aguaceiros esporádicos" },
      { month: "Novembro", score: 60, note: "Início do monção" },
      { month: "Dezembro", score: 65, note: "Época festiva atrai multidões apesar da chuva" }
    ],
    highlights: [
      { name: "Ubud Monkey Forest", type: "Natureza", emoji: "🐒", description: "Reserva natural sagrada com centenas de macacos" },
      { name: "Tanah Lot Temple", type: "Cultura", emoji: "⛩️", description: "Templo icónico no mar, famoso pelo pôr do sol" },
      { name: "Tegalalang Rice Terraces", type: "Paisagem", emoji: "🌾", description: "Socalcos de arroz verdejantes com baloiços famosos" },
      { name: "Uluwatu Temple Cliff", type: "Cultura", emoji: "🌅", description: "Templo na falésia com dança Kecak ao pôr do sol" },
      { name: "Mount Batur Sunrise", type: "Aventura", emoji: "🌋", description: "Caminhada noturna para ver o sol nascer no vulcão" },
      { name: "Nusa Penida Day Trip", type: "Praia", emoji: "🏝️", description: "Kelingking Beach — as famosas falésias T-Rex" }
    ],
    avoidList: [
      "Conduzir mota sem experiência nas estradas caóticas",
      "Kuta Beach — praias sujas e cheias de vendedores insistentes",
      "Esquecer o repelente de insetos (risco de Dengue)"
    ],
    budgetGuide: {
      backpacker: { perDay: 25, note: "Homestays, warungs locais, aluguer de mota" },
      midRange: { perDay: 70, note: "Villa privada, cafés ocidentais, tours contratados" },
      luxury: { perDay: 250, note: "Resorts 5★ em Ubud/Uluwatu, spa de luxo" }
    },
    practicalInfo: {
      visa: "Visa on Arrival (VoA), 30 dias",
      currency: "Rupia Indonésia (IDR)",
      language: "Indonésio e Balinês — inglês fluente em turismo",
      transport: "Scooter ou Grab/Gojek (carro ou mota com condutor)",
      plug: "Tipo C e F, 230V",
      safety: "Seguro, cuidado com correntes no mar e burlas de táxis",
      tipping: "Não obrigatório, mas muito apreciado"
    },
    nearbyEscapes: [
      { name: "Gili Islands", distance: "2h30 fast boat", cost: 35, note: "Ilhas sem carros, tartarugas gigantes" },
      { name: "Lombok", distance: "45min voo ou 3h barco", cost: 40, note: "Surfing fantástico e praias desertas" },
      { name: "Nusa Lembongan", distance: "30min fast boat", cost: 15, note: "Vibe relaxada, snorkeling com mantas" }
    ],
    andorScore: 92
  },
  newyork: {
    slug: "newyork",
    name: "Nova Iorque",
    country: "USA",
    flag: "🇺🇸",
    coordinates: [40.7128, -74.0060],
    heroImage: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1600&q=75&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1522083165195-342750297f91?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=75&auto=format&fit=crop"
    ],
    tagline: "A cidade que nunca dorme — energia, cultura e skylines incríveis",
    andorVerdict: "Nova Iorque vive a um ritmo frenético. O seu skyline intimida à chegada e apaixona à partida. A magia está em caminhar sem rumo pelas avenidas largas e cruzar bairros totalmente distintos em poucos quarteirões.",
    bestMonths: [
      { month: "Janeiro", score: 50, note: "Muito frio, preços mínimos" },
      { month: "Fevereiro", score: 55, note: "Frio e possibilidade de neve" },
      { month: "Março", score: 65, note: "Transição ventosa" },
      { month: "Abril", score: 85, note: "Primavera agradável, Central Park florido" },
      { month: "Maio", score: 92, note: "Clima perfeito, eventos ao ar livre" },
      { month: "Junho", score: 90, note: "Caloroso mas vibrante" },
      { month: "Julho", score: 70, note: "Muito quente e húmido" },
      { month: "Agosto", score: 68, note: "Calor intenso, cheiro nas ruas" },
      { month: "Setembro", score: 94, note: "O melhor mês — clima ideal" },
      { month: "Outubro", score: 92, note: "Outono dourado no Central Park" },
      { month: "Novembro", score: 75, note: "Frio mas animado (Thanksgiving)" },
      { month: "Dezembro", score: 88, note: "Natal em NYC, pista do Rockefeller" }
    ],
    highlights: [
      { name: "Central Park", type: "Natureza", emoji: "🌳", description: "O pulmão verde de Manhattan — alugue uma bicicleta" },
      { name: "Times Square", type: "Icónico", emoji: "🗽", description: "Luzes e ecrãs gigantes, vá à noite" },
      { name: "Empire State Building", type: "Vistas", emoji: "🏙️", description: "O observatório clássico, prefira o pôr do sol" },
      { name: "High Line & Chelsea Market", type: "Urbano", emoji: "🌿", description: "Jardim elevado sobre antigas linhas de comboio" },
      { name: "Brooklyn Bridge", type: "Icónico", emoji: "🌉", description: "Atravesse a pé de Manhattan para Brooklyn" },
      { name: "Broadway Shows", type: "Cultura", emoji: "🎭", description: "Os melhores musicais do mundo — compre bilhetes no TKTS" }
    ],
    avoidList: [
      "Comprar comida em carrinhos de rua não tabelados",
      "Pegar táxis pretos não oficiais à saída do aeroporto",
      "Visitar a Estátua da Liberdade por dentro sem reserva com meses de antecedência"
    ],
    budgetGuide: {
      backpacker: { perDay: 75, note: "Hostels em Brooklyn, fatias de pizza de $1, metro" },
      midRange: { perDay: 200, note: "Hotel 3-4★ em Long Island City, jantares casuais" },
      luxury: { perDay: 600, note: "Hotel de luxo em Manhattan, jantares requintados, Broadway" }
    },
    practicalInfo: {
      visa: "ESTA obrigatório para cidadãos da UE",
      currency: "Dólar Americano ($)",
      language: "Inglês — espanhol muito comum",
      transport: "Metro com cartão MetroCard ou contactless OMNY",
      plug: "Tipo A e B, 120V",
      safety: "Segura em geral, atenção nas zonas desertas à noite",
      tipping: "18-22% obrigatório em restaurantes e serviços"
    },
    nearbyEscapes: [
      { name: "Washington D.C.", distance: "3h30 comboio Amtrak", cost: 90, note: "Museus gratuitos do Smithsonian e a Casa Branca" },
      { name: "Boston", distance: "4h comboio ou autocarro", cost: 45, note: "História americana e atmosfera universitária" },
      { name: "Philadelphia", distance: "1h30 comboio", cost: 35, note: "A famosa escadaria do Rocky e o sino da liberdade" }
    ],
    andorScore: 94
  },
  lisboa: {
    slug: "lisboa",
    name: "Lisboa",
    country: "Portugal",
    flag: "🇵🇹",
    coordinates: [38.7223, -9.1393],
    heroImage: "https://images.unsplash.com/photo-1509840841025-9088ba78a826?w=1600&q=75&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1543872084-c7bd3822856f?w=800&q=75&auto=format&fit=crop"
    ],
    tagline: "A cidade das sete colinas, luz atlântica e fado",
    andorVerdict: "Lisboa alia tradição e modernidade com uma luz única. A gastronomia, os miradouros e a simpatia local justificam toda a fama recente.",
    bestMonths: [
      { month: "Janeiro", score: 65, note: "Inverno suave, dias de sol curtos" },
      { month: "Fevereiro", score: 68, note: "Clima fresco mas agradável" },
      { month: "Março", score: 78, note: "Início da primavera quente" },
      { month: "Abril", score: 84, note: "Excelente época, poucos turistas" },
      { month: "Maio", score: 92, note: "O melhor mês — sol e flores" },
      { month: "Junho", score: 95, note: "Festas Populares, cidade fervilhante" },
      { month: "Julho", score: 88, note: "Quente, muito vento ao anoitecer" },
      { month: "Agosto", score: 85, note: "Muito quente, locais de férias" },
      { month: "Setembro", score: 92, note: "Clima soberbo, mar de água quente" },
      { month: "Outubro", score: 82, note: "Outono suave com aguaceiros" },
      { month: "Novembro", score: 70, note: "Frio moderado, chuva ocasional" },
      { month: "Dezembro", score: 68, note: "Luzes de Natal, invernos solarengos" }
    ],
    highlights: [
      { name: "Castelo de São Jorge", type: "História", emoji: "🏰", description: "Fortaleza moura com vistas deslumbrantes sobre o rio" },
      { name: "Alfama", type: "Bairro", emoji: "🎵", description: "Ruas estreitas, fado nas tascas e espírito de bairro" },
      { name: "Mosteiro dos Jerónimos", type: "História", emoji: "🏛️", description: "Obra-prima manuelina em Belém" },
      { name: "Elétrico 28", type: "Icónico", emoji: "🚋", description: "Passeio clássico pelas colinas mais antigas" },
      { name: "Pastéis de Belém", type: "Gastronomia", emoji: "🍮", description: "Os originais e inigualáveis pastéis de nata desde 1837" },
      { name: "Miradouro da Senhora do Monte", type: "Vistas", emoji: "🌅", description: "A vista panorâmica mais alta e bonita da cidade" }
    ],
    avoidList: [
      "Jantar em restaurantes de fado com porteiros insistentes",
      "Andar de táxi sem taxímetro ligado em zonas centrais",
      "Apanhar o elétrico 28 em horas de ponta (prefira manhã cedo)"
    ],
    budgetGuide: {
      backpacker: { perDay: 40, note: "Hostels de topo, petiscos e metro" },
      midRange: { perDay: 100, note: "Guesthouse acolhedora, restaurantes de bairro" },
      luxury: { perDay: 300, note: "Hotéis 5★ na Av. Liberdade, jantares contemporâneos" }
    },
    practicalInfo: {
      visa: "Sem visto para cidadãos da UE",
      currency: "Euro (€)",
      language: "Português — inglês muito falado",
      transport: "Metro e Carris, cartão Viva Viagem recarregável",
      plug: "Tipo C e F, 230V",
      safety: "Muito segura, cuidado com carteiristas no elétrico 28",
      tipping: "Apenas se o serviço for excecional (5-10%)"
    },
    nearbyEscapes: [
      { name: "Sintra", distance: "40min comboio", cost: 5, note: "Vilas misteriosas e Palácio da Pena romântico" },
      { name: "Cascais", distance: "30min comboio", cost: 5, note: "Antiga vila piscatória, praias e marisco de excelência" },
      { name: "Évora", distance: "1h30 autocarro", cost: 15, note: "Património mundial do Alentejo, templos romanos" }
    ],
    andorScore: 91
  },
  barcelona: {
    slug: "barcelona",
    name: "Barcelona",
    country: "Spain",
    flag: "🇪🇸",
    coordinates: [41.3851, 2.1734],
    heroImage: "https://images.unsplash.com/photo-1583422409516-2895a77efedd?w=1600&q=75&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=800&q=75&auto=format&fit=crop"
    ],
    tagline: "A cidade de Gaudí — sol, mar, arte e tapas incríveis",
    andorVerdict: "Barcelona é fascinante. O modernismo catalão preenche as ruas com curvas e cores fantásticas, equilibrado pelas praias soalheiras e noites longas repletas de tapas.",
    bestMonths: [
      { month: "Janeiro", score: 60, note: "Frio mas ensolarado, sem filas" },
      { month: "Fevereiro", score: 62, note: "Carnaval e clima ameno" },
      { month: "Março", score: 72, note: "Início de esplanadas" },
      { month: "Abril", score: 85, note: "Dia de Sant Jordi (livros e rosas)" },
      { month: "Maio", score: 90, note: "Clima perfeito, praias abertas" },
      { month: "Junho", score: 94, note: "Festivais e noite de San Juan" },
      { month: "Julho", score: 80, note: "Muito calor, época altíssima" },
      { month: "Agosto", score: 75, note: "Humidade elevada e muitos turistas" },
      { month: "Setembro", score: 91, note: "Clima perfeito, Festas da Mercè" },
      { month: "Outubro", score: 80, note: "Outono agradável com banhos de mar" },
      { month: "Novembro", score: 68, note: "Fresco mas limpo" },
      { month: "Dezembro", score: 65, note: "Atmosfera natalícia e compras" }
    ],
    highlights: [
      { name: "Sagrada Família", type: "Arte", emoji: "⛪", description: "A obra-prima inacabada de Gaudí — marque com semanas de antecedência" },
      { name: "Park Güell", type: "Paisagem", emoji: "🦎", description: "Parque colorido com os famosos mosaicos e vistas sobre a cidade" },
      { name: "Barri Gòtic", type: "Bairro", emoji: "🏛️", description: "Bairro medieval com ruelas e praças cheias de história" },
      { name: "La Rambla & La Boqueria", type: "Gastronomia", emoji: "🍍", description: "A avenida pedonal mais famosa e o seu mercado de frescos" },
      { name: "Casa Batlló", type: "Arte", emoji: "🐉", description: "Arquitetura fantástica inspirada em lendas marinas" },
      { name: "Barceloneta Beach", type: "Lazer", emoji: "🏖️", description: "Praia central, ideal para paella ao sol" }
    ],
    avoidList: [
      "Comer nas Ramblas — má qualidade e muito inflacionado",
      "Deixar pertences sem vigilância na praia da Barceloneta (muito roubo)",
      "Comprar bilhetes na hora para a Sagrada Família (esgotam sempre)"
    ],
    budgetGuide: {
      backpacker: { perDay: 50, note: "Hostel no Raval, sandes de jamón, metro" },
      midRange: { perDay: 130, note: "Hotel no Eixample, restaurantes de tapas" },
      luxury: { perDay: 350, note: "Hotel boutique de design, jantares criativos" }
    },
    practicalInfo: {
      visa: "Sem visto para cidadãos da UE",
      currency: "Euro (€)",
      language: "Catalão e Espanhol — inglês amplamente falado",
      transport: "Rede de metro excelente com passe T-Casual (10 viagens)",
      plug: "Tipo C e F, 230V",
      safety: "Cuidado extremo com carteiristas no metro e Ramblas",
      tipping: "Não obrigatório, arredondar a conta é normal"
    },
    nearbyEscapes: [
      { name: "Montserrat", distance: "1h comboio", cost: 12, note: "Mosteiro nas montanhas com formas geológicas bizarras" },
      { name: "Sitges", distance: "40min comboio", cost: 6, note: "Vila costeira bonita com praias fantásticas" },
      { name: "Girona", distance: "38min comboio rápido", cost: 16, note: "Cidade medieval, muralhas e locais de Game of Thrones" }
    ],
    andorScore: 89
  },
  roma: {
    slug: "roma",
    name: "Roma",
    country: "Italy",
    flag: "🇮🇹",
    coordinates: [41.9028, 12.4964],
    heroImage: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1600&q=75&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1529260830199-445524b1d286?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1498503182468-3b51cbb6cb24?w=800&q=75&auto=format&fit=crop"
    ],
    tagline: "A cidade eterna — história viva, praças barrocas e massa soberba",
    andorVerdict: "Roma é um museu a céu aberto. Cada canto esconde uma ruína romana, uma fonte barroca ou uma gelataria excecional. A melhor forma de a viver é perder-se pelas ruelas de Trastevere ao fim da tarde.",
    bestMonths: [
      { month: "Janeiro", score: 55, note: "Frio e calmo, ideal para museus" },
      { month: "Fevereiro", score: 58, note: "Frio, perfeito para fotos sem filas" },
      { month: "Março", score: 72, note: "Início da primavera romana" },
      { month: "Abril", score: 88, note: "Clima maravilhoso (evite a Páscoa)" },
      { month: "Maio", score: 94, note: "O melhor mês — sol e esplanadas" },
      { month: "Junho", score: 90, note: "Muito sol, dias longos e quentes" },
      { month: "Julho", score: 65, note: "Calor opressivo, muito turístico" },
      { month: "Agosto", score: 55, note: "Locais fechados por férias, calor" },
      { month: "Setembro", score: 90, note: "Excelente regresso do sol ameno" },
      { month: "Outubro", score: 88, note: "Ottobrata Romana — dias dourados" },
      { month: "Novembro", score: 65, note: "Chuvoso mas fresco" },
      { month: "Dezembro", score: 68, note: "Luzes nas praças antigas e presépios" }
    ],
    highlights: [
      { name: "Coliseu", type: "História", emoji: "🏟️", description: "O maior anfiteatro do mundo antigo — compre bilhete conjunto com Fórum Romano" },
      { name: "Panteão", type: "História", emoji: "🏛️", description: "Templo romano com a maior cúpula de betão não armado do mundo" },
      { name: "Fontana di Trevi", type: "Icónico", emoji: "⛲", description: "Lance uma moeda para garantir o seu regresso à cidade" },
      { name: "Museus do Vaticano & Capela Sistina", type: "Arte", emoji: "🎨", description: "Os frescos lendários de Miguel Ângelo" },
      { name: "Trastevere", type: "Bairro", emoji: "🍝", description: "Ruelas boémias medievais, ótimas pizzarias e tascas locais" },
      { name: "Piazza Navona", type: "Cultura", emoji: "⛲", description: "A praça barroca mais bonita, com fontes de Bernini" }
    ],
    avoidList: [
      "Comer nos restaurantes mesmo em frente ao Coliseu ou Panteão",
      "Comprar garrafas de água aos vendedores de rua (existem centenas de fontes gratuitas nas ruas, os 'nasoni')",
      "Pegar táxis sem taxímetro oficial na estação Termini"
    ],
    budgetGuide: {
      backpacker: { perDay: 45, note: "Hostel perto de Termini, pizza al taglio, fontes grátis" },
      midRange: { perDay: 120, note: "Hotel boutique no centro, jantares de massas clássicas" },
      luxury: { perDay: 380, note: "Hotéis de luxo históricos, experiências gastronómicas privadas" }
    },
    practicalInfo: {
      visa: "Sem visto para cidadãos da UE",
      currency: "Euro (€)",
      language: "Italiano — inglês aceitável em turismo",
      transport: "Rede de metro simples (Linhas A e B), autocarros",
      plug: "Tipo C, F e L, 230V",
      safety: "Cuidado com carteiristas no metro e autocarro 64 (Vaticano)",
      tipping: "Serviço incluído ('coperto'), gorjeta pequena se gostar"
    },
    nearbyEscapes: [
      { name: "Tivoli (Villa d'Este)", distance: "1h comboio ou autocarro", cost: 8, note: "Jardins renascentistas com fontes monumentais" },
      { name: "Ostia Antiga", distance: "30min comboio local", cost: 3, note: "As ruínas do porto comercial da Roma Antiga" },
      { name: "Florença", distance: "1h30 comboio rápido Frecciarossa", cost: 35, note: "Berço do renascimento, cúpula de Brunelleschi" }
    ],
    andorScore: 93
  },
  santorini: {
    slug: "santorini",
    name: "Santorini",
    country: "Greece",
    flag: "🇬🇷",
    coordinates: [36.4166, 25.4324],
    heroImage: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=75&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=75&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=75&auto=format&fit=crop"
    ],
    tagline: "Casas brancas de cúpulas azuis sobre falésias vulcânicas",
    andorVerdict: "Santorini é visualmente arrebatadora. Embora muito turística, ver o pôr do sol em Oia sobre a caldeira vulcânica é uma experiência que todos deviam ter uma vez na vida.",
    bestMonths: [
      { month: "Janeiro", score: 40, note: "Frio, muitas lojas e resorts fechados" },
      { month: "Fevereiro", score: 42, note: "Pouco recomendável por ventos" },
      { month: "Março", score: 60, note: "Abertura gradual, fresco" },
      { month: "Abril", score: 80, note: "Páscoa grega, flores e sol ameno" },
      { month: "Maio", score: 92, note: "Excelente clima, ilha verdejante" },
      { month: "Junho", score: 95, note: "Espectacular tempo de praia" },
      { month: "Julho", score: 88, note: "Pico do verão, muito cheio" },
      { month: "Agosto", score: 85, note: "Muito quente e sobrelotado" },
      { month: "Setembro", score: 94, note: "O melhor mês — mar quente" },
      { month: "Outubro", score: 88, note: "Final de época solarengo" },
      { month: "Novembro", score: 62, note: "Início de ventos e chuvas" },
      { month: "Dezembro", score: 45, note: "Inverno calmo e ventoso" }
    ],
    highlights: [
      { name: "Pôr do sol em Oia", type: "Icónico", emoji: "🌅", description: "O pôr do sol mais famoso do mar Egeu — chegue 2h antes" },
      { name: "Caldera Cruise", type: "Lazer", emoji: "⛵", description: "Catamarã pelas águas vulcânicas, fontes termais" },
      { name: "Red Beach", type: "Praia", emoji: "🏖️", description: "Praia única cercada por falésias vulcânicas vermelhas" },
      { name: "Akrotiri Archaeological Site", type: "História", emoji: "🏛️", description: "A 'Pompeia do Egeu' — preservada em cinzas vulcânicas" },
      { name: "Caminhada Fira-Oia", type: "Aventura", emoji: "🥾", description: "Trilho de 10km pela crista da caldeira com vistas incríveis" },
      { name: "Pyrgos Village", type: "Cultura", emoji: "⛪", description: "Vila medieval no interior, sem as multidões das falésias" }
    ],
    avoidList: [
      "Andar nos burros para subir os degraus em Fira (crueldade animal)",
      "Visitar Oia nos dias com 4-5 navios de cruzeiro atracados ao mesmo tempo",
      "Alugar moto-quatro de baixa cilindrada para as subidas íngremes"
    ],
    budgetGuide: {
      backpacker: { perDay: 60, note: "Hostels em Perissa, giroscópios gregos, autocarros locais" },
      midRange: { perDay: 160, note: "Hotel com piscina no interior, tavernas de peixe fresco" },
      luxury: { perDay: 500, note: "Suites trogloditas com piscina infinita na falésia em Oia" }
    },
    practicalInfo: {
      visa: "Sem visto para cidadãos da UE",
      currency: "Euro (€)",
      language: "Grego — inglês fluente em turismo",
      transport: "Rede de autocarros KTEL centralizada em Fira, aluguer de carro/mota",
      plug: "Tipo C e F, 230V",
      safety: "Extremamente seguro, cuidado ao caminhar junto à falésia",
      tipping: "Agradecido mas opcional (5-10% nas tavernas)"
    },
    nearbyEscapes: [
      { name: "Ios", distance: "40min fast ferry", cost: 20, note: "Praias douradas fantásticas e vida noturna jovem" },
      { name: "Mykonos", distance: "2h fast ferry", cost: 45, note: "Festa luxuosa e moinhos de vento clássicos" },
      { name: "Naxos", distance: "1h30 ferry", cost: 25, note: "Excelente gastronomia grega tradicional e praias calmas" }
    ],
    andorScore: 90
  }
};

export default function DestinationDetail({ params }) {
  // Use React.use() to unwrap the dynamic route parameters in Next 16+
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const dest = destinations[slug?.toLowerCase()];

  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [showSticky, setShowSticky] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    if (dest) {
      document.title = `${dest.name} · Andor Travels`;
      trackEvent('destination_viewed', { slug: dest.slug, name: dest.name, country: dest.country });
    }

    const handleScroll = () => {
      setShowSticky(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);

    // Check if favorited
    if (dest) {
      try {
        const stored = localStorage.getItem('andor_favorite_destinations');
        if (stored) {
          const favs = JSON.parse(stored);
          const found = favs.some(f => f.slug === dest.slug);
          setIsFavorited(found);
        }
      } catch (e) {}
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [dest]);

  const toggleFavorite = () => {
    if (!dest) return;
    try {
      const stored = localStorage.getItem('andor_favorite_destinations');
      let favs = stored ? JSON.parse(stored) : [];
      if (isFavorited) {
        favs = favs.filter(f => f.slug !== dest.slug);
        setIsFavorited(false);
        trackEvent('favorite_removed', { type: 'destination', slug: dest.slug });
      } else {
        const newItem = {
          slug: dest.slug,
          city: dest.name,
          country: dest.country,
          flag: dest.flag,
          image: dest.heroImage,
          dateSaved: new Date().toLocaleDateString('pt-PT')
        };
        favs.push(newItem);
        setIsFavorited(true);
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 800);
        trackEvent('favorite_added', { type: 'destination', slug: dest.slug, name: dest.name });
      }
      localStorage.setItem('andor_favorite_destinations', JSON.stringify(favs));
      
      // Dispatch custom event to notify other components (like Favorites)
      window.dispatchEvent(new Event('favorites-updated'));
    } catch (e) {}
  };

  if (!dest) {
    return (
      <>
        <Navbar />
        <div className={styles.notFound}>
          <h2>Destino não encontrado 🧭</h2>
          <p>O destino solicitado não faz parte dos nossos guias premium atualmente.</p>
          <a href="/" className={styles.primaryBtn}>Voltar à Homepage</a>
        </div>
        <Footer />
      </>
    );
  }

  const currentMonthIndex = new Date().getMonth();
  const monthsAbbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const getMonthColor = (score) => {
    if (score >= 85) return 'var(--success, #10b981)';
    if (score >= 60) return 'var(--warning, #f59e0b)';
    return 'var(--danger, #ef4444)';
  };

  const destinationJsonLd = dest ? {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "name": dest.name,
    "description": dest.tagline,
    "image": dest.heroImage,
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": dest.coordinates?.[0] || 0,
      "longitude": dest.coordinates?.[1] || 0
    },
    "touristType": "Leisure, Culture, Nature"
  } : null;

  return (
    <>
      {destinationJsonLd && (
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(destinationJsonLd) }} 
        />
      )}
      <Navbar />
      <main className={styles.main}>
        {/* HERO SECTION */}
        <section className={styles.heroSection} style={{ backgroundImage: `url(${dest.heroImage})` }}>
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroContent}>
            <span className={styles.scoreBadge}>
              ✦ {dest.andorScore} Andor Score
            </span>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroFlag}>{dest.flag}</span>
              {dest.name}
            </h1>
            <p className={styles.heroCountry}>{dest.country}</p>
            <p className={styles.heroTagline}>{dest.tagline}</p>
            
            <button 
              onClick={toggleFavorite} 
              className={`${styles.favoriteHeartBtn} ${isFavorited ? styles.heartActive : ''}`}
              aria-label="Guardar nos favoritos"
            >
              <svg className={styles.heartSvg} viewBox="0 0 24 24" width="24" height="24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              {showParticles && (
                <div className={styles.particlesContainer}>
                  <span className={`${styles.particle} ${styles.p1}`}></span>
                  <span className={`${styles.particle} ${styles.p2}`}></span>
                  <span className={`${styles.particle} ${styles.p3}`}></span>
                  <span className={`${styles.particle} ${styles.p4}`}></span>
                  <span className={`${styles.particle} ${styles.p5}`}></span>
                  <span className={`${styles.particle} ${styles.p6}`}></span>
                </div>
              )}
            </button>

            <div className={styles.scrollIndicator}>
              <span className={styles.scrollText}>Desliza para explorar</span>
              <div className={styles.scrollDot}></div>
            </div>
          </div>
        </section>

        {/* DETAILS CONTAINER */}
        <div className={styles.container}>
          {/* VEREDITO */}
          <section className={styles.verdictSection}>
            <div className={styles.quoteBox}>
              <span className={styles.quoteIcon}>✦</span>
              <h2 className={styles.verdictTitle}>O Veredito do Andor</h2>
              <blockquote className={styles.verdictQuote}>
                "{dest.andorVerdict}"
              </blockquote>
            </div>
          </section>

          {/* BEST TIME TO VISIT (CLIMATE CHART) */}
          <section className={styles.climateSection}>
            <h2 className={styles.sectionTitle}>Melhor Época para Visitar</h2>
            <p className={styles.sectionSubtitle}>
              Classificação mensal com base em meteorologia, preço e afluência de público.
            </p>
            <div className={styles.chartContainer}>
              <div className={styles.barChart}>
                {dest.bestMonths.map((m, index) => {
                  const isCurrent = index === currentMonthIndex;
                  return (
                    <div 
                      key={m.month} 
                      className={`${styles.chartBarCol} ${isCurrent ? styles.barCurrent : ''}`}
                      onMouseEnter={() => setHoveredMonth(m)}
                      onMouseLeave={() => setHoveredMonth(null)}
                    >
                      <div className={styles.barValue}>{m.score}%</div>
                      <div className={styles.barOuter}>
                        <div 
                          className={styles.barInner} 
                          style={{ 
                            height: `${m.score}%`, 
                            backgroundColor: getMonthColor(m.score) 
                          }}
                        ></div>
                      </div>
                      <div className={styles.barMonthLabel}>
                        {monthsAbbrev[index]}
                        {isCurrent && <span className={styles.nowLabel}>Agora</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {hoveredMonth && (
                <div className={styles.monthTooltip}>
                  <strong>{hoveredMonth.month}</strong>: {hoveredMonth.note}
                </div>
              )}
            </div>
          </section>

          {/* GALLERIES / HIGHLIGHTS */}
          <section className={styles.highlightsSection}>
            <h2 className={styles.sectionTitle}>O Que Não Perdes</h2>
            <p className={styles.sectionSubtitle}>As atrações e experiências obrigatórias com curadoria da nossa agência.</p>
            <div className={styles.highlightsGrid}>
              {dest.highlights.map((h) => (
                <div key={h.name} className={styles.highlightCard}>
                  <div className={styles.highlightHeader}>
                    <span className={styles.highlightEmoji}>{h.emoji}</span>
                    <div>
                      <h3 className={styles.highlightName}>{h.name}</h3>
                      <span className={styles.highlightType}>{h.type}</span>
                    </div>
                  </div>
                  <p className={styles.highlightDesc}>{h.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* GALLERY IMAGES */}
          <section className={styles.gallerySection}>
            <h2 className={styles.sectionTitle}>Galeria do Explorador</h2>
            <div className={styles.galleryWrapper}>
              <div className={styles.galleryActive}>
                <img src={dest.gallery[activeGalleryIndex]} alt={dest.name} className={styles.activeImg} loading="lazy" decoding="async" width="800" height="480" />
              </div>
              <div className={styles.galleryThumbs}>
                {dest.gallery.map((img, index) => (
                  <button 
                    key={index} 
                    onClick={() => setActiveGalleryIndex(index)}
                    className={`${styles.thumbBtn} ${index === activeGalleryIndex ? styles.thumbActive : ''}`}
                  >
                    <img src={img} alt="Miniatura" className={styles.thumbImg} loading="lazy" decoding="async" width="100" height="75" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* AVOID LIST (HONEST) */}
          <section className={styles.avoidSection}>
            <div className={styles.avoidCard}>
              <h2 className={styles.avoidTitle}>❌ O Que Saltas (Opinião Honesta)</h2>
              <p className={styles.avoidSubtitle}>Fuja das armadilhas para turistas e economize tempo e dinheiro precioso.</p>
              <ul className={styles.avoidList}>
                {dest.avoidList.map((item, index) => (
                  <li key={index} className={styles.avoidItem}>
                    <span className={styles.avoidIcon}>✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* BUDGET CALCULATOR / TIER PRICES */}
          <section className={styles.budgetSection}>
            <h2 className={styles.sectionTitle}>Quanto Custa?</h2>
            <p className={styles.sectionSubtitle}>Estimativa realista de custos diários para diferentes estilos de viagem.</p>
            <div className={styles.budgetGrid}>
              <div className={styles.budgetCard}>
                <h3 className={styles.budgetCardTitle}>🎒 Mochileiro</h3>
                <div className={styles.priceTag}>
                  <span className={styles.priceCurrency}>€</span>
                  <span className={styles.priceAmt}>{dest.budgetGuide.backpacker.perDay}</span>
                  <span className={styles.pricePer}>/dia</span>
                </div>
                <p className={styles.budgetCardDesc}>{dest.budgetGuide.backpacker.note}</p>
                <a 
                  href={`/?wizard=true&dest=${encodeURIComponent(dest.name + ', ' + dest.country)}&step=2&budget=backpacker`} 
                  className={styles.budgetCardBtn}
                >
                  Criar Itinerário Mochileiro
                </a>
              </div>

              <div className={`${styles.budgetCard} ${styles.budgetCardFeatured}`}>
                <div className={styles.featuredBadge}>Mais Equilibrado</div>
                <h3 className={styles.budgetCardTitle}>🏨 Mid-range</h3>
                <div className={styles.priceTag}>
                  <span className={styles.priceCurrency}>€</span>
                  <span className={styles.priceAmt}>{dest.budgetGuide.midRange.perDay}</span>
                  <span className={styles.pricePer}>/dia</span>
                </div>
                <p className={styles.budgetCardDesc}>{dest.budgetGuide.midRange.note}</p>
                <a 
                  href={`/?wizard=true&dest=${encodeURIComponent(dest.name + ', ' + dest.country)}&step=2&budget=midRange`} 
                  className={styles.budgetCardBtnFeatured}
                >
                  Criar Itinerário Mid-range
                </a>
              </div>

              <div className={styles.budgetCard}>
                <h3 className={styles.budgetCardTitle}>💎 Luxo</h3>
                <div className={styles.priceTag}>
                  <span className={styles.priceCurrency}>€</span>
                  <span className={styles.priceAmt}>{dest.budgetGuide.luxury.perDay}</span>
                  <span className={styles.pricePer}>/dia</span>
                </div>
                <p className={styles.budgetCardDesc}>{dest.budgetGuide.luxury.note}</p>
                <a 
                  href={`/?wizard=true&dest=${encodeURIComponent(dest.name + ', ' + dest.country)}&step=2&budget=luxury`} 
                  className={styles.budgetCardBtn}
                >
                  Criar Itinerário Luxo
                </a>
              </div>
            </div>
          </section>

          {/* PRACTICAL INFO */}
          <section className={styles.practicalSection}>
            <h2 className={styles.sectionTitle}>Informações Práticas</h2>
            <div className={styles.practicalGrid}>
              <div className={styles.practicalItem}>
                <strong>🛂 Visto:</strong> {dest.practicalInfo.visa}
              </div>
              <div className={styles.practicalItem}>
                <strong>💵 Moeda:</strong> {dest.practicalInfo.currency}
              </div>
              <div className={styles.practicalItem}>
                <strong>🗣️ Idioma:</strong> {dest.practicalInfo.language}
              </div>
              <div className={styles.practicalItem}>
                <strong>🚇 Transporte:</strong> {dest.practicalInfo.transport}
              </div>
              <div className={styles.practicalItem}>
                <strong>🔌 Eletricidade:</strong> {dest.practicalInfo.plug}
              </div>
              <div className={styles.practicalItem}>
                <strong>🛡️ Segurança:</strong> {dest.practicalInfo.safety}
              </div>
              <div className={styles.practicalItem}>
                <strong>☕ Gorjetas:</strong> {dest.practicalInfo.tipping}
              </div>
            </div>
          </section>

          {/* ESCAPADAS PROXIMAS */}
          <section className={styles.escapesSection}>
            <h2 className={styles.sectionTitle}>Escapadas Próximas</h2>
            <p className={styles.sectionSubtitle}>Locais recomendados a pouca distância de viagem.</p>
            <div className={styles.escapesGrid}>
              {dest.nearbyEscapes.map((esc) => (
                <div key={esc.name} className={styles.escapeCard}>
                  <h3 className={styles.escapeName}>{esc.name}</h3>
                  <div className={styles.escapeMeta}>
                    <span>⏱️ {esc.distance}</span>
                    <span>💰 ~€{esc.cost} viagem</span>
                  </div>
                  <p className={styles.escapeNote}>{esc.note}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* STICKY BOTTOM BUTTON */}
        {showSticky && (
          <div className={styles.stickyBar}>
            <div className={styles.stickyInner}>
              <p className={styles.stickyText}>Queres explorar {dest.name} ao teu ritmo?</p>
              <a 
                href={`/?wizard=true&dest=${encodeURIComponent(dest.name + ', ' + dest.country)}&step=2`}
                className={styles.stickyBtn}
              >
                ✨ Criar Itinerário para {dest.name} →
              </a>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
