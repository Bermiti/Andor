// Comprehensive destination data for Andor travel guides
// Each destination includes: verdict, weather calendar, skip list, highlights, nearbyEscapes

export const destinationData = {
  tokyo: {
    name: 'Tóquio',
    slug: 'tokyo',
    country: 'Japão',
    flag: '🇯🇵',
    emoji: '🏯',
    
    // Andor Verdict: Poetic, specific, unmissable
    verdict: {
      title: 'Tokyo: Onde o Futuro Encontra a Tradição',
      summary: 'Uma cidade onde você pode tomar chá em um templo de 1000 anos de manhã e experimentar tecnologia holográfica à noite. Tóquio não é apenas uma cidade; é um estado de perpétua transformação.',
      whyVisit: 'Experiência de culturas coexistentes, culinária incomparável, e a sensação de estar no futuro enquanto caminha em ruas que existem há séculos.',
      idealFor: 'Viajantes urbanos, entusiastas de tecnologia, amantes de gastronomia, culturalmente curiosos',
    },

    // 12-month weather & experience calendar
    weatherCalendar: [
      { month: 'Janeiro', temp: '5°C', condition: 'Claro e seco', crowds: 'Moderado', price: '€€', notes: 'Cerimônias de ano novo, céu limpo' },
      { month: 'Fevereiro', temp: '6°C', condition: 'Claro', crowds: 'Baixo', price: '€', notes: 'Flores de ameixa, menos turistas' },
      { month: 'Março', temp: '12°C', condition: 'Variável', crowds: 'Alto', price: '€€€', notes: 'Começa a época de cerejeiras' },
      { month: 'Abril', temp: '17°C', condition: 'Perfeito', crowds: 'Muito alto', price: '€€€', notes: 'AUGE: Pico de flores de cerejeira' },
      { month: 'Maio', temp: '22°C', condition: 'Quente/Úmido', crowds: 'Alto', price: '€€', notes: 'Começam as chuvas' },
      { month: 'Junho', temp: '24°C', condition: 'Chuvoso', crowds: 'Moderado', price: '€€', notes: 'Rainy season (tsuyu)' },
      { month: 'Julho', temp: '28°C', condition: 'Quente/Húmido', crowds: 'Muito alto', price: '€€€', notes: 'Férias de verão, festivais' },
      { month: 'Agosto', temp: '29°C', condition: 'Quente/Húmido', crowds: 'Muito alto', price: '€€€', notes: 'Calor extremo, muitos festivais' },
      { month: 'Setembro', temp: '24°C', condition: 'Variável', crowds: 'Moderado', price: '€€', notes: 'Risco de tufões no final do mês' },
      { month: 'Outubro', temp: '18°C', condition: 'Perfeito', crowds: 'Alto', price: '€€', notes: 'Céu azul, folhagens de outono' },
      { month: 'Novembro', temp: '13°C', condition: 'Claro', crowds: 'Moderado', price: '€', notes: 'Cores de outono no pico' },
      { month: 'Dezembro', temp: '8°C', condition: 'Claro e seco', crowds: 'Muito alto', price: '€€€', notes: 'Iluminações de Natal, ano novo' },
    ],

    // Skip list: honest, specific reasons
    skipList: [
      {
        attraction: 'Cruzamento de Shibuya (nas horas de pico)',
        reason: 'É uma atração turística por si só, mas geralmente é apinhada e caótica. Se você realmente quer experimentar Tóquio autêntica, os pequenos becos de Harajuku ou as ruas residenciais são muito melhores.',
      },
      {
        attraction: 'Sensoji Temple (caminho principal)',
        reason: 'O templo é histórico, mas o caminho de compras foi completamente transformado em uma zona de compras turística. Visite cedo (6h-7h) ou explore templos alternativos em Asakusa.',
      },
      {
        attraction: 'Tóquio Skytree (à noite)',
        reason: 'As vistas são boas, mas não vale a pena pelo preço e pelas multidões. Recomendamos a Observatória da Câmara Metropolitana (gratuita) para vistas melhores ao pôr do sol.',
      },
      {
        attraction: 'Takeshita Dori (durante o dia)',
        reason: 'Rua turística por excelência em Harajuku. Recomendamos: ir no início da manhã (antes das 8h) ou explorar ruas laterais e lojas independentes em vez disso.',
      },
      {
        attraction: 'Restaurantes de sushi preparado (em áreas turísticas)',
        reason: 'Geralmente superando expectativas apenas por localização. Saia para pequenas vielas e encontre restaurantes locais - a comida será melhor e mais barata.',
      },
      {
        attraction: 'Roppongi (especialmente à noite)',
        reason: 'Area de bares turístico com preços inflacionados e qualidade questionável. Escolha Shibuya, Shinjuku ou áreas residenciais em vez disso.',
      },
    ],

    // Top attractions with insider knowledge
    highlights: [
      {
        name: 'Tsukiji Outer Market (Tsukijoe Jogai)',
        why: 'Comida de rua autêntica, peixes frescos do dia, melhor ao amanhecer',
        insiderTip: 'Chegue antes das 8h, coma em pequenos bistrôs locais, não nas lojas turísticas',
      },
      {
        name: 'Meiji Shrine & Yoyogi Park',
        why: 'Floresta sagrada no meio da cidade, paz genuína após multidões',
        insiderTip: 'Visite antes das 8h ou após 16h, explore os becos laterais que poucos encontram',
      },
      {
        name: 'Asakusa (lado não turístico)',
        why: 'Bairro histórico que ainda mantém autenticidade longe da rua principal',
        insiderTip: 'Cruze para o lado leste do templo, explore onsen tradicionais e restaurantes familiares',
      },
      {
        name: 'Akihabara (Tech Culture)',
        why: 'Não apenas lojas; vitrines culturais de anime, manga, arcade retrô',
        insiderTip: 'Explore os prédios menores com arcadas multiandar e lojas vintage',
      },
      {
        name: 'Shinjuku Nightlife (Omoide Yokocho)',
        why: 'Beco de memórias: pequenos bares que fazem você se sentir em um filme dos anos 80',
        insiderTip: 'Aprenda a dizer "omakase" (deixe-me escolher), coma ao balcão, faça amigos locais',
      },
      {
        name: 'Seasonal Foods Festival (Depachika)',
        why: 'Porões de departamentos cheios de especialidades regionais de todo o Japão',
        insiderTip: 'Vá no final do dia para descontos (destruídos antes do fechamento)',
      },
      {
        name: 'Ghibli Museum (fora de Tóquio, Mitaka)',
        why: 'Experiência imersiva em arte de animação, construído para espanto',
        insiderTip: 'Reserve com meses de antecedência, compre ingressos com semanas de avanço',
      },
      {
        name: 'Onsens em Bairros Residenciais',
        why: 'Banheiros públicos tradicionais, rituais de spa verdadeiros',
        insiderTip: 'Use Google Translate, observe os locais, entenda o protocolo de etiqueta',
      },
    ],

    // Nearby escapes
    nearbyEscapes: [
      {
        name: 'Nikko',
        distance: '140km (2h de trem)',
        why: 'Santuários em floresta, cachoeiras, frieza de montanha',
      },
      {
        name: 'Kawagoe',
        distance: '50km (30min de trem)',
        why: 'Pequena Edo, rua histórica intacta, bairro bem preservado',
      },
      {
        name: 'Mt. Fuji / Hakone',
        distance: '100-120km (2-3h)',
        why: 'Pico épico, onsens quentes naturais, paisagem alpina',
      },
      {
        name: 'Yokohama',
        distance: '30km (30min de trem)',
        why: 'Porta marítima histórica, museus, gastronomia coastal',
      },
      {
        name: 'Kamakura',
        distance: '50km (1h de trem)',
        why: 'Templos litorâneos, cerejeiras, sensação de vila litorânea de verão',
      },
    ],

    // Practical info
    practical: {
      visa: 'Isenção de visto para até 90 dias (UE)',
      currency: 'Iene Japonês (JPY) ~ €0.0065 por ¥1',
      transport: 'JR Pass, IC Card (Suica/Pasmo), rede de metrô excepcional',
      language: 'Inglês limitado; apps de tradução essenciais',
      safety: 'Extremamente seguro, crime quase inexistente',
      bestApps: 'Tabelog (restaurantes), Hyperdia (trens), app local de metro',
    },
  },

  paris: {
    name: 'Paris',
    slug: 'paris',
    country: 'França',
    flag: '🇫🇷',
    emoji: '🗼',

    verdict: {
      title: 'Paris: A Cidade da Luz Continua Brilhando',
      summary: 'Paris não precisa de defesa. Mas o Paris autêntico exige investigação. Saia das rotas turísticas principais e descubra por que é chamada de "A Cidade da Luz"—não apenas pelos edifícios, mas pela qualidade calmante da vida aqui.',
      whyVisit: 'Arquitetura que te deixa boquiaberto, gastronomia que redefiniu o mundo, e a capacidade de se perder e ainda estar em um lugar maravilhoso.',
      idealFor: 'Amantes de arte, casais românticos, apreciadores de gastronomia, flaneurs, artistas',
    },

    weatherCalendar: [
      { month: 'Janeiro', temp: '4°C', condition: 'Frio e cinzento', crowds: 'Baixo', price: '€', notes: 'Melhor orçamento, céu romântico' },
      { month: 'Fevereiro', temp: '5°C', condition: 'Frio', crowds: 'Baixo', price: '€', notes: 'Ainda barato, flores em alguns jardins' },
      { month: 'Março', temp: '9°C', condition: 'Fresco', crowds: 'Moderado', price: '€€', notes: 'Primavera começa' },
      { month: 'Abril', temp: '12°C', condition: 'Agradável', crowds: 'Alto', price: '€€€', notes: 'Paris perfeita, flores de cerejeira' },
      { month: 'Maio', temp: '16°C', condition: 'Belo', crowds: 'Muito alto', price: '€€€', notes: 'Apogeu de primavera' },
      { month: 'Junho', temp: '20°C', condition: 'Quente', crowds: 'Muito alto', price: '€€€', notes: 'Noites longas, picos de verão' },
      { month: 'Julho', temp: '22°C', condition: 'Quente', crowds: 'Extremo', price: '€€€', notes: 'Vários parisienses de férias' },
      { month: 'Agosto', temp: '21°C', condition: 'Quente', crowds: 'Extremo', price: '€€€', notes: 'Agosto é bom mês para escapar' },
      { month: 'Setembro', temp: '18°C', condition: 'Perfeito', crowds: 'Alto', price: '€€', notes: 'Melhor mês: clima e menos multidões' },
      { month: 'Outubro', temp: '13°C', condition: 'Fresco', crowds: 'Moderado', price: '€€', notes: 'Folhagens de outono, chuvas ocasionais' },
      { month: 'Novembro', temp: '8°C', condition: 'Cinzento', crowds: 'Baixo', price: '€€', notes: 'Melancolia de outono, ótimo para atmosfera' },
      { month: 'Dezembro', temp: '5°C', condition: 'Frio', crowds: 'Moderado', price: '€€', notes: 'Mercados de Natal, férias de ano novo' },
    ],

    skipList: [
      {
        attraction: 'Torre Eiffel (entrada principal)',
        reason: 'Filas absurdas, perspectivas mediocres. Veja-a do Pont d\'Iéna, Trocadéro ou suba as escadas apenas se for hardcore.',
      },
      {
        attraction: 'Musée du Louvre (dias úteis à tarde)',
        reason: 'Pode ter as multidões de um festival de rock. Chegue antes das 9h ou vá quarta à noite (aberto até 21h45).',
      },
      {
        attraction: 'Champs-Élysées',
        reason: 'Rua de neon turística. Explorar os bulevares laterais oferece uma sensação parisiense verdadeira.',
      },
      {
        attraction: 'Catacumbas de Paris (com guia turístico)',
        reason: 'Interessante, mas frequentemente superlotado. Considere a cripta sob Notre-Dame em vez disso.',
      },
      {
        attraction: 'Moulin Rouge (show turístico)',
        reason: 'Espetáculo genérico. Se você realmente quer cabaré, pesquise pequenos clubes em Pigalle.',
      },
      {
        attraction: 'Sacré-Cœur (caminho principal)',
        reason: 'A vista é bela, mas a multidão de vendedores é insuportável. Vá cedo (6h-7h).',
      },
    ],

    highlights: [
      {
        name: 'Marais Neighborhood',
        why: 'Ruas medievais, galerias ocultas, bares incríveis, vida LGBTQ+ vibrante',
        insiderTip: 'Explore Place des Vosges no final da manhã, coma falafel em Rue des Rosiers, visite galerias de arte escondidas',
      },
      {
        name: 'Musée de Montmartre & Vineyards',
        why: 'Charme parisiense verdadeiro, longe das multidões, vinha funcional',
        insiderTip: 'Pule a basílica, vá para o museu e depois sente-se em um café local',
      },
      {
        name: 'Latin Quarter (lado secreto)',
        why: 'Livros antigos, pequenos cafés, intelectualismo autêntico',
        insiderTip: 'Explorar livrarias usadas em Rue Mouffetard, fazer compras em mercearias tradicionais',
      },
      {
        name: 'Sainte-Chapelle',
        why: 'Vitrais do século XIII que deixam você sem ar, multidão menor que Notre-Dame',
        insiderTip: 'Chegue antes das 9h ou visite em sexta à noite para um show de vidro',
      },
      {
        name: 'Canal Saint-Martin',
        why: 'Parisienses locais, piqueniques verdadeiros, romance descontraído',
        insiderTip: 'Caminhe de norte a sul, piquenique de delicatessens, sente-se na água ao pôr do sol',
      },
      {
        name: 'Père Lachaise Cemetery',
        why: 'Não é sombrio—é bonito, histórico, com personagens interessantes enterrados aqui',
        insiderTip: 'Encontre a lápide de Oscar Wilde, de Jim Morrison, explore esculturas secretas',
      },
    ],

    nearbyEscapes: [
      {
        name: 'Versailles',
        distance: '17km (35min de trem)',
        why: 'Palácio épico, jardins que redefinem escala',
      },
      {
        name: 'Fontainebleau',
        distance: '60km (45min de trem)',
        why: 'Castelo menor, floresta para caminhar, menos turismo',
      },
      {
        name: 'Monet\'s Giverny',
        distance: '80km (45min de trem + ônibus)',
        why: 'Água-mãe, jardim impressionista vivo',
      },
      {
        name: 'Loire Valley',
        distance: '250km (2h de trem)',
        why: 'Castelos de contos de fadas, vinhas, aventura de um dia',
      },
    ],

    practical: {
      visa: 'Schengen',
      currency: 'Euro (EUR)',
      transport: 'RATP (metrô/ônibus), bicicleta Vélib',
      language: 'Francês, inglês limitado; educado falar francês primeiro',
      safety: 'Seguro, mas cartécias em metrôs à noite',
      bestApps: 'RATP App, Citymapper, TripAdvisor',
    },
  },

  // ... (adding more destinations following the same structure)
  // For brevity in this response, I'll add one more complete example

  bali: {
    name: 'Bali',
    slug: 'bali',
    country: 'Indonésia',
    flag: '🇮🇩',
    emoji: '🌴',

    verdict: {
      title: 'Bali: Mais do que Praias de Cartão Postal',
      summary: 'Bali é onde a espiritualidade balinesiana encontra o turismo de praia. Os rices e os templos são reais; as multidões também. O verdadeiro Bali exige exploração além de Ubud.',
      whyVisit: 'Praias de surfe, espiritualidade genuína, gastronomia em evolução, pessoas calorosas',
      idealFor: 'Surfistas, mochileiros, ioga/bem-estar, artistas, viajantes aventureiros',
    },

    weatherCalendar: [
      { month: 'Janeiro', temp: '27°C', condition: 'Chuvoso', crowds: 'Moderado', price: '€', notes: 'Monção de chuvas' },
      { month: 'Fevereiro', temp: '27°C', condition: 'Chuvoso', crowds: 'Baixo', price: '€', notes: 'Ainda úmido' },
      { month: 'Março', temp: '27°C', condition: 'Chuvoso', crowds: 'Baixo', price: '€', notes: 'Cerimônias Nyepi' },
      { month: 'Abril', temp: '27°C', condition: 'Começando a secar', crowds: 'Moderado', price: '€€', notes: 'Transição' },
      { month: 'Maio', temp: '26°C', condition: 'Seco', crowds: 'Alto', price: '€€€', notes: 'Melhor surfe, começam férias' },
      { month: 'Junho', temp: '25°C', condition: 'Seco', crowds: 'Muito alto', price: '€€€', notes: 'Pico seco, férias escolares' },
      { month: 'Julho', temp: '24°C', condition: 'Seco', crowds: 'Extremo', price: '€€€', notes: 'Mais quente da estação seca' },
      { month: 'Agosto', temp: '24°C', condition: 'Seco', crowds: 'Extremo', price: '€€€', notes: 'Surfe de topo' },
      { month: 'Setembro', temp: '25°C', condition: 'Seco', crowds: 'Alto', price: '€€', notes: 'Ainda belo, menos multidões' },
      { month: 'Outubro', temp: '26°C', condition: 'Começando monção', crowds: 'Moderado', price: '€€', notes: 'Transição' },
      { month: 'Novembro', temp: '26°C', condition: 'Úmido', crowds: 'Baixo', price: '€', notes: 'Começa o calor de chuva' },
      { month: 'Dezembro', temp: '27°C', condition: 'Chuvoso', crowds: 'Moderado', price: '€€', notes: 'Festas de final de ano' },
    ],

    skipList: [
      {
        attraction: 'Ubud Monkey Forest (durante o dia)',
        reason: 'Monges podem ser agressivos. Visite cedo (6h) ou considere Sangeh (menos turismo).',
      },
      {
        attraction: 'Tanah Lot (ao pôr do sol)',
        reason: 'Templo fotogênico, mas apinhado demais. Vá cedo ou escolha o templo de Uluwatu com melhor vista.',
      },
      {
        attraction: 'Bali Swings (Instagram Bait)',
        reason: 'Caro, turístico, segurança questionável. Melhor: andar pelo vale em vez disso.',
      },
      {
        attraction: 'Turismo de Comida em Ubud',
        reason: 'Geralmente não é comida balinesa legítima. Vá para Warung local, não cafés turísticos.',
      },
      {
        attraction: 'Kuta Beach (dias úteis)',
        reason: 'Areia de lixo, desenvolvedores turísticos. Explore Nusa Dua ou praias secretas em vez disso.',
      },
      {
        attraction: 'Templos durante cerimônias (como turista)',
        reason: 'Desrespeitoso. Assistir apenas se convidado ou em situações apropriadas.',
      },
    ],

    highlights: [
      {
        name: 'Tegalalang Rice Terraces (caminhar)',
        why: 'Paisagem em camadas de jade, caminhada através dos campos',
        insiderTip: 'Comece cedo, evite rotas turísticas principais, caminhe entre as plantas de arroz',
      },
      {
        name: 'Ubud Traditional Market',
        why: 'Comida real, especiarias, artesanato local genuíno',
        insiderTip: 'Vá cedo, aprenda a negociar, coma no mercado',
      },
      {
        name: 'Lempuyang Temple (Temples of Heaven)',
        why: 'Caminhada desafiadora, templo de topo com vista épica',
        insiderTip: 'Inicie antes das 5h, traga muita água, abra puertas antes das 8h',
      },
      {
        name: 'Nusa Tenggara Island Hopping',
        why: 'Praias virgens, snorkel, vida selvagem única',
        insiderTip: 'Reserve com operadores locais, não agências turísticas',
      },
      {
        name: 'Seminyak Sunset & Nightlife',
        why: 'Praia civilizada, bares sofisticados, vida noturna real',
        insiderTip: 'Haga amigos, visite bares locais, evite clubes turísticos obvios',
      },
    ],

    nearbyEscapes: [
      {
        name: 'Lombok',
        distance: 'Ferry/voo de 1 hora',
        why: 'Praias ainda menos desenvolvidas, picos de montanha, cultura Sasak',
      },
      {
        name: 'Gili Islands',
        distance: 'Ferry de 1.5h',
        why: 'Praias cristalinas, sem carros, mergulho e snorkel',
      },
      {
        name: 'Flores Island',
        distance: 'Voo de 1h',
        why: 'Flores selvagens, vulcões, mais aventura',
      },
    ],

    practical: {
      visa: 'Visto VOA (chegada), pagável na chegada',
      currency: 'Rupia Indonésia (IDR) ~ €0.000063',
      transport: 'Motocicleta alugada é melhor; não dirija em Ubud',
      language: 'Indonésio/Balinês, inglês comum em turismo',
      safety: 'Seguro em geral, mas cuidado com moto e buzs',
      bestApps: 'GrabBike, app local de transportes, booking.com',
    },
  },
};

export default destinationData;
