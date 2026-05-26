#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE_DIR = path.join(__dirname, 'eval-fixtures');
const REPORT_DIR = path.join(ROOT, 'reports');
const REPORT_JSON = path.join(REPORT_DIR, 'itinerary-eval-report.json');
const REPORT_MD = path.join(REPORT_DIR, 'itinerary-eval-report.md');

const TEST_CASES = [
  { id: 'tokyo-7-days', destination: 'Tokyo', days: 7, groupType: 'solo traveller', budgetTier: 'mid-range', travelStyle: 'culture + food', fixture: 'tokyo-7-days.json' },
  { id: 'paris-5-days', destination: 'Paris', days: 5, groupType: 'couple', budgetTier: 'mid-range', travelStyle: 'romance + museums + food', fixture: 'paris-5-days.json' },
  { id: 'bali-10-days', destination: 'Bali', days: 10, groupType: 'friends', budgetTier: 'balanced budget', travelStyle: 'beaches + temples + nature', fixture: 'bali-10-days.json' },
  { id: 'lisbon-3-days', destination: 'Lisbon', days: 3, groupType: 'solo traveller', budgetTier: 'budget', travelStyle: 'food + viewpoints + history', fixture: 'lisbon-3-days.json' },
  { id: 'new-york-4-days', destination: 'New York', days: 4, groupType: 'couple', budgetTier: 'premium', travelStyle: 'architecture + food + nightlife', fixture: 'new-york-4-days.json' },
  { id: 'rome-4-days', destination: 'Rome', days: 4, groupType: 'family', budgetTier: 'mid-range', travelStyle: 'history + food', fixture: 'rome-4-days.json' },
];

const BOUNDS = {
  tokyo: { latMin: 35.0, latMax: 36.5, lngMin: 138.5, lngMax: 140.5, center: [35.6762, 139.6503] },
  paris: { latMin: 48.5, latMax: 49.2, lngMin: 1.8, lngMax: 2.8, center: [48.8566, 2.3522] },
  bali: { latMin: -8.9, latMax: -8.0, lngMin: 114.8, lngMax: 115.8, center: [-8.3405, 115.0920] },
  lisbon: { latMin: 38.4, latMax: 39.1, lngMin: -9.6, lngMax: -8.7, center: [38.7223, -9.1393] },
  'new york': { latMin: 40.3, latMax: 41.0, lngMin: -74.3, lngMax: -73.5, center: [40.7128, -74.0060] },
  rome: { latMin: 41.7, latMax: 42.1, lngMin: 12.2, lngMax: 12.8, center: [41.9028, 12.4964] },
};

const BANNED_TITLE_PATTERNS = [
  /^explore\s+/i,
  /^discover\s+/i,
  /^visit\s+/i,
  /^day\s+\d+\s+in\s+/i,
  /^day\s+\d+$/i,
  /^\w+\s+day\s+\d+$/i,
  /^.+\s+day\s+\d+$/i,
];

const GENERIC_TEXT = [
  'hidden gem',
  'beautiful place',
  'local area',
  'try local food',
  'enjoy the vibe',
  'must see',
  'great views',
];

const FIXTURE_BLUEPRINTS = {
  'tokyo-7-days': {
    destination: {
      city: 'Tokyo',
      country: 'Japan',
      countryCode: 'JP',
      flag: 'JP',
      coordinates: [35.6762, 139.6503],
      timezone: 'Asia/Tokyo',
      currency: { code: 'JPY', symbol: 'JPY', euroRate: 0.0061 },
    },
    budget: { flights: [690, 920], accommodation: 910, food: 390, activities: 270, transport: 92, total: [2352, 2582], perPerson: [2352, 2582] },
    accommodation: { name: 'Nohga Hotel Ueno Tokyo', area: 'Ueno', nightlyEstimate: 130 },
    flightOptions: [{ airline: 'ANA / Lufthansa', route: 'Europe to Haneda via Frankfurt', estimate: 790, bookingWindow: 'Book 10-14 weeks ahead for spring/autumn.' }],
    nearbyEscapes: [
      { name: 'Kamakura', distance: '58 km', transportCost: 12, idealFor: 'temples and coast', daysToAdd: 1, tip: 'Go on a weekday and start at Kita-Kamakura.' },
      { name: 'Nikko', distance: '150 km', transportCost: 38, idealFor: 'shrines and cedar forest', daysToAdd: 2, tip: 'Sleep overnight if you want the lakes without rushing.' },
    ],
    suggestions: ['Swap one neon night for jazz in Aoyama', 'Add a Kamakura day trip', 'Make this more food-led'],
    days: [
      {
        title: 'First Light in Asakusa: Senso-ji Smoke & Sumida Calm',
        emoji: 'temple',
        mood: 'Soft landing, early lanterns, and a first taste of old Tokyo before the city fully wakes.',
        area: 'Asakusa and Ueno',
        activities: [
          ['Senso-ji Temple at Dawn', 'culture', '2 Chome-3-1 Asakusa, Taito City', [35.7148, 139.7967], '07:30', '90 min', 0, 4.7, 'Enter through Kaminarimon before 8:00, then step one lane east for quieter photos.'],
          ['Tokyo National Museum Highlights', 'museum', '13-9 Uenokoen, Taito City', [35.7188, 139.7765], '10:15', '2h', 12, 4.6, 'Use the Honkan second floor first; it tells the clearest Japan story in under two hours.'],
        ],
        meals: ['FEBRUARY KITCHEN', 'Asakusa Mugitoro', 'Kamiya Bar'],
        localSecret: 'After Senso-ji, walk behind the temple to Senzoku-dori where older residents buy snacks; the rice cracker shops there feel more everyday than Nakamise.',
      },
      {
        title: 'Neon Crossings: Shibuya Rooftops & Harajuku Side Streets',
        emoji: 'neon',
        mood: 'A controlled dive into Tokyo pop culture, with the loud bits balanced by pocket gardens and back lanes.',
        area: 'Shibuya and Harajuku',
        activities: [
          ['Meiji Jingu Forest Walk', 'culture', '1-1 Yoyogikamizonocho, Shibuya City', [35.6764, 139.6993], '09:00', '90 min', 0, 4.7, 'Take the north path after the main shrine; it is calmer and smells of cedar after rain.'],
          ['Shibuya Sky Sunset Slot', 'viewpoint', '2 Chome-24-12 Shibuya, Shibuya City', [35.6584, 139.7016], '16:30', '90 min', 18, 4.8, 'Book the 45 minutes before sunset; arrive 20 minutes early for locker queues.'],
        ],
        meals: ['Bread, Espresso &', 'Uobei Shibuya Dogenzaka', 'Uogashi Nihon-Ichi Standing Sushi'],
        localSecret: 'Cat Street is best before 11:00 or after 17:00; in the middle of the day, detour into the Design Festa Gallery lanes for quieter shops.',
      },
      {
        title: 'Market Knives & Ginza Glass: Tsukiji Breakfast to Art Houses',
        emoji: 'food',
        mood: 'A food-first day that keeps everything walkable between market counters, polished avenues, and small galleries.',
        area: 'Tsukiji and Ginza',
        activities: [
          ['Tsukiji Outer Market Breakfast Loop', 'food', '4 Chome-16-2 Tsukiji, Chuo City', [35.6655, 139.7702], '08:00', '2h', 24, 4.5, 'Skip the longest tuna skewer queues; the grilled scallop counters turn faster and are usually better value.'],
          ['Ginza Graphic Gallery', 'design', '7 Chome-7-2 Ginza, Chuo City', [35.6682, 139.7620], '13:30', '75 min', 0, 4.4, 'Check the basement first; the smaller poster shows are often the most memorable.'],
        ],
        meals: ['Turret Coffee', 'Tsukiji Itadori Bekkan', 'Ginza Kagari Honten'],
        localSecret: 'The rooftop garden above Ginza Six is free and rarely packed; take a convenience-store tea there between lunch and galleries.',
      },
      {
        title: 'Old Edo Backstreets: Yanaka Cats & Ueno Afterglow',
        emoji: 'walk',
        mood: 'Slow wooden houses, cemetery paths, and the feeling that Tokyo still has small-town pockets.',
        area: 'Yanaka and Nezu',
        activities: [
          ['Yanaka Cemetery Morning Walk', 'history', '7 Chome-5 Yanaka, Taito City', [35.7250, 139.7702], '09:00', '90 min', 0, 4.5, 'Follow the side paths behind Tennoji; the older stone markers are shaded and peaceful.'],
          ['Nezu Shrine Vermilion Gates', 'shrine', '1 Chome-28-9 Nezu, Bunkyo City', [35.7202, 139.7601], '11:00', '75 min', 0, 4.6, 'Go before lunch and use the smaller west entrance to avoid the photo queue at the torii tunnel.'],
        ],
        meals: ['Kayaba Coffee', 'Hantei Nezu', 'Tayori Yanaka'],
        localSecret: 'Yanaka Ginza is best from the staircase at Yuyake Dandan around 16:30, when shop shutters glow and locals buy croquettes for dinner.',
      },
      {
        title: 'Art Islands in the City: Roppongi Quiet Rooms & Aoyama Jazz',
        emoji: 'art',
        mood: 'A polished, grown-up Tokyo day with museums, architecture, and a slower evening soundtrack.',
        area: 'Roppongi and Aoyama',
        activities: [
          ['Mori Art Museum', 'art', '6 Chome-10-1 Roppongi, Minato City', [35.6605, 139.7292], '10:30', '2h', 14, 4.5, 'Pair the exhibition with the city view only if visibility is clear; otherwise spend longer in the show.'],
          ['Nezu Museum Garden', 'museum', '6 Chome-5-1 Minamiaoyama, Minato City', [35.6621, 139.7176], '14:30', '90 min', 11, 4.7, 'The garden path behind the cafe is the reason to come; leave time after the collection rooms.'],
        ],
        meals: ['Blue Bottle Aoyama', 'Maisen Aoyama Honten', 'Body & Soul Aoyama'],
        localSecret: 'If Roppongi feels too corporate, slip into Nogi Shrine before the museum; it is five minutes away and resets the pace instantly.',
      },
      {
        title: 'River Wind & Electric Towns: Kiyosumi Tea to Akihabara Glow',
        emoji: 'river',
        mood: 'Gardens, coffee, and the strange joy of letting Tokyo shift from quiet water to electric signs.',
        area: 'Kiyosumi and Akihabara',
        activities: [
          ['Kiyosumi Garden', 'garden', '3 Chome-3-9 Kiyosumi, Koto City', [35.6812, 139.7977], '09:30', '75 min', 2, 4.6, 'Sit by the stepping stones for ten minutes; it is a rare central Tokyo pause.'],
          ['Akihabara Radio Kaikan', 'culture', '1 Chome-15-16 Sotokanda, Chiyoda City', [35.6984, 139.7712], '15:00', '90 min', 0, 4.4, 'Start upstairs and work down; the lower floors are louder and easier once you know the layout.'],
        ],
        meals: ['Arise Coffee Roasters', 'Fukagawa Kamasho', 'Kikanbo Kanda Honten'],
        localSecret: 'Use the Sumida River paths between Kiyosumi and Ryogoku if weather is clear; it is flatter, prettier, and calmer than the metro hop.',
      },
      {
        title: 'Last Bow in Shinjuku: Garden Stillness & Golden Gai Doors',
        emoji: 'night',
        mood: 'A final day built for souvenirs, a beautiful garden pause, and one last Tokyo night without rushing.',
        area: 'Shinjuku',
        activities: [
          ['Shinjuku Gyoen National Garden', 'garden', '11 Naitomachi, Shinjuku City', [35.6852, 139.7101], '10:00', '2h', 4, 4.8, 'Use the Sendagaya gate if the main entrance queue is long; it drops you near the quieter lawns.'],
          ['Golden Gai Intro Walk', 'nightlife', '1 Chome-1-6 Kabukicho, Shinjuku City', [35.6938, 139.7042], '20:00', '90 min', 35, 4.4, 'Choose bars with English menu boards outside; cover charges are clearer and the welcome is warmer.'],
        ],
        meals: ['Verve Coffee Shinjuku', 'Fuunji', 'Omoide Yokocho Yakitori Stand'],
        localSecret: 'For last-minute gifts, skip department-store ground floors and use Isetan B1 depachika after 18:30 when seasonal sweets are easy to compare.',
      },
    ],
  },
  'paris-5-days': {
    destination: { city: 'Paris', country: 'France', countryCode: 'FR', flag: 'FR', coordinates: [48.8566, 2.3522], timezone: 'Europe/Paris', currency: { code: 'EUR', symbol: 'EUR', euroRate: 1 } },
    budget: { flights: [180, 340], accommodation: 980, food: 520, activities: 310, transport: 58, total: [2048, 2208], perPerson: [1024, 1104] },
    accommodation: { name: 'Hotel des Grands Boulevards', area: '2nd arrondissement', nightlyEstimate: 196 },
    flightOptions: [{ airline: 'Air France / easyJet', route: 'Major European hubs to CDG or ORY', estimate: 260, bookingWindow: 'Book 6-9 weeks out outside holidays.' }],
    nearbyEscapes: [
      { name: 'Versailles', distance: '23 km', transportCost: 8, idealFor: 'gardens and royal history', daysToAdd: 1, tip: 'Go on a fountain-show day only if you book early.' },
      { name: 'Giverny', distance: '75 km', transportCost: 28, idealFor: 'Monet gardens', daysToAdd: 1, tip: 'Best from late April to June; take the earliest train.' },
    ],
    suggestions: ['Make it more romantic', 'Add a Versailles day', 'Swap museums for food markets'],
    days: [
      { title: 'Left Bank Promises: Saint-Germain Cafes & Orsay Gold', emoji: 'art', mood: 'A gentle Paris arrival with classic rooms, river light, and just enough romance.', area: 'Saint-Germain', activities: [['Musee d Orsay', 'museum', '1 Rue de la Legion d Honneur', [48.8599, 2.3266], '10:00', '2h', 16, 4.8, 'Start on the top floor with the clocks, then descend chronologically.'], ['Pont des Arts Sunset Walk', 'walk', 'Pont des Arts', [48.8584, 2.3376], '17:45', '45 min', 0, 4.5, 'Arrive from the Louvre side so the Institut de France frames the crossing.']], meals: ['Cafe de Flore', 'Le Comptoir du Relais', 'Semilla'], localSecret: 'Rue de Seine has small galleries that stay lively before dinner; duck into whichever has people holding plastic wine cups at the opening.' },
      { title: 'Marais After Rain: Courtyards, Falafel & Picasso Rooms', emoji: 'courtyard', mood: 'Narrow lanes, hidden hotels particuliers, and a food crawl that never feels staged.', area: 'Le Marais', activities: [['Musee Picasso Paris', 'museum', '5 Rue de Thorigny', [48.8599, 2.3623], '10:30', '90 min', 14, 4.4, 'Use the attic-level rooms to understand the building before the collection.'], ['Place des Vosges Arcades', 'history', 'Place des Vosges', [48.8556, 2.3655], '15:00', '60 min', 0, 4.7, 'The Victor Hugo corner is quieter; sit under the northeast arcade if it rains.']], meals: ['Fragments', 'Miznon Marais', 'Chez Janou'], localSecret: 'The garden of Hotel de Sully is free to cross and makes the prettiest quiet shortcut from Rue Saint-Antoine to Place des Vosges.' },
      { title: 'Montmartre Before Applause: Abbesses Stairs & Pink Corners', emoji: 'hill', mood: 'A hilltop morning before tour groups, then a softer afternoon of small streets and wine bars.', area: 'Montmartre', activities: [['Sacre-Coeur Basilica', 'landmark', '35 Rue du Chevalier de la Barre', [48.8867, 2.3431], '08:30', '75 min', 0, 4.7, 'Use the side stairs from Rue Lamarck for a calmer ascent.'], ['Musee de la Vie Romantique', 'museum', '16 Rue Chaptal', [48.8813, 2.3331], '14:00', '75 min', 9, 4.5, 'The courtyard tea pause is the point; avoid rushing it.']], meals: ['Hardware Societe Paris', 'Bouillon Pigalle', 'Le Bon Georges'], localSecret: 'Skip portrait pitches on Place du Tertre; the better living Montmartre is Rue des Trois Freres before lunch.' },
      { title: 'Grand Axes, Small Tables: Louvre Edges & Palais Royal Shade', emoji: 'palace', mood: 'A high-culture day routed to avoid museum fatigue and keep meals close.', area: 'Louvre and Palais Royal', activities: [['Louvre Denon Wing Focus', 'museum', 'Rue de Rivoli', [48.8606, 2.3376], '09:00', '2h 30 min', 22, 4.8, 'Pick three targets and leave; the win is not pretending to see everything.'], ['Palais Royal Garden', 'garden', '8 Rue de Montpensier', [48.8649, 2.3376], '15:00', '60 min', 0, 4.7, 'Use the covered galleries if weather turns; the benches under lime trees are ideal after the Louvre.']], meals: ['Cafe Kitsune Palais Royal', 'Juveniles', 'Ellsworth'], localSecret: 'Galerie Vivienne is prettiest around 10:00 before lunch crowds; it is also a refined rainy-day detour two minutes away.' },
      { title: 'Seine Finale: Islands, Booksellers & Eiffel Blue Hour', emoji: 'river', mood: 'The iconic finale, done slowly enough to feel like Paris rather than a checklist.', area: 'Ile de la Cite and Eiffel Tower', activities: [['Sainte-Chapelle Morning Slot', 'chapel', '10 Boulevard du Palais', [48.8554, 2.3450], '09:00', '60 min', 13, 4.8, 'Book the first slot; stained glass is magical before the room fills.'], ['Trocadero Blue Hour View', 'viewpoint', 'Place du Trocadero', [48.8629, 2.2870], '19:30', '60 min', 0, 4.6, 'Stand on Avenue de Camoens first for a quieter view before Trocadero.']], meals: ['Shakespeare and Company Cafe', 'Clamato', 'Les Ombres'], localSecret: 'For bouquinistes, browse the left-bank side near Quai de Montebello; sellers there are often more book-focused than souvenir-heavy.' },
    ],
  },
  'bali-10-days': {
    destination: { city: 'Bali', country: 'Indonesia', countryCode: 'ID', flag: 'ID', coordinates: [-8.3405, 115.0920], timezone: 'Asia/Makassar', currency: { code: 'IDR', symbol: 'IDR', euroRate: 0.000057 } },
    budget: { flights: [720, 1040], accommodation: 760, food: 330, activities: 420, transport: 210, total: [2440, 2760], perPerson: [815, 920] },
    accommodation: { name: 'Adiwana Bisma Ubud plus Canggu guesthouse split', area: 'Ubud and Canggu', nightlyEstimate: 76 },
    flightOptions: [{ airline: 'Qatar / Turkish / Singapore Airlines', route: 'Europe to Denpasar via Doha/Istanbul/Singapore', estimate: 880, bookingWindow: 'Book 3-5 months ahead for July-August.' }],
    nearbyEscapes: [
      { name: 'Nusa Lembongan', distance: '30 min fast boat', transportCost: 32, idealFor: 'clear water and slower beaches', daysToAdd: 2, tip: 'Stay overnight instead of doing a rushed day trip.' },
      { name: 'Gili Air', distance: '2.5 h fast boat', transportCost: 48, idealFor: 'snorkeling and car-free evenings', daysToAdd: 3, tip: 'Avoid if seas are rough; boats can be uncomfortable.' },
    ],
    suggestions: ['Add a Nusa Lembongan overnight', 'Make this surf-focused', 'Lower the private-driver costs'],
    days: [
      { title: 'Canggu Soft Landing: Batu Bolong Surf & Warung Smoke', emoji: 'surf', mood: 'Beach rhythm, easy food, and a first sunset without forcing too much after arrival.', area: 'Canggu', activities: [['Batu Bolong Beach Surf Check', 'beach', 'Pantai Batu Bolong, Canggu', [-8.6595, 115.1301], '08:30', '90 min', 8, 4.5, 'Rent boards from the middle stalls, not the first beach entrance.'], ['Samadi Sunday Market', 'market', 'Jl. Padang Linjong No.39, Canggu', [-8.6475, 115.1392], '11:00', '75 min', 0, 4.4, 'Go before 11:30 for the best fruit and fewer scooter jams.']], meals: ['Crate Cafe', 'Warung Bu Mi', 'Mason Canggu'], localSecret: 'Use the small lane behind Deus to cross Canggu on foot; it avoids the loudest scooter bottleneck around Batu Bolong.' },
      { title: 'Ubud Green Hours: Rice Terraces & Sacred Springs', emoji: 'rice', mood: 'A cooler inland day of water, terraces, and temple etiquette with breathing room.', area: 'Ubud north', activities: [['Tegallalang Rice Terrace', 'nature', 'Jalan Raya Tegallalang, Gianyar', [-8.4357, 115.2793], '08:00', '90 min', 2, 4.5, 'Enter from a side cafe path and tip the farmers if you walk through working fields.'], ['Tirta Empul Temple', 'temple', 'Jl. Tirta, Tampaksiring', [-8.4264, 115.3150], '11:00', '90 min', 4, 4.6, 'Bring a change of clothes if doing purification; sarongs are required even for photos.']], meals: ['Seniman Coffee', 'Hujan Locale', 'Locavore NXT'], localSecret: 'Ask your driver to stop at Gunung Kawi Sebatu instead if Tirta Empul is packed; it is gentler and often more spiritual.' },
      { title: 'Clifftop Fire: Uluwatu Temple & Padang Padang Tide Pools', emoji: 'cliff', mood: 'Limestone edges, monkeys, and a dramatic sunset that still needs practical timing.', area: 'Uluwatu', activities: [['Padang Padang Beach', 'beach', 'Jl. Labuan Sait, Pecatu', [-8.8111, 115.1026], '09:00', '2h', 1, 4.4, 'Check tide first; at high tide the beach shrinks and feels crowded.'], ['Uluwatu Temple Kecak', 'temple', 'Pecatu, South Kuta', [-8.8291, 115.0849], '16:30', '2h', 10, 4.6, 'Keep sunglasses and phones zipped; monkeys target loose items near the cliff path.']], meals: ['Suka Espresso Uluwatu', 'Warung Bejana', 'Mana Uluwatu'], localSecret: 'For sunset, the cliff path north of the amphitheater is quieter than the main Kecak queue and gives a cleaner horizon.' },
      { title: 'Blue Water Reset: Sanur Dawn & Lembongan Mangroves', emoji: 'boat', mood: 'A marine day designed around calmer morning seas and an early return.', area: 'Sanur and Nusa Lembongan', activities: [['Sanur Sunrise Promenade', 'walk', 'Pantai Sanur, Denpasar', [-8.6871, 115.2632], '06:15', '60 min', 0, 4.5, 'Walk north before breakfast; the local fishing boats are active before tour groups arrive.'], ['Nusa Lembongan Mangrove Boat', 'nature', 'Jungutbatu, Nusa Lembongan', [-8.6788, 115.4556], '10:30', '2h', 18, 4.5, 'Take the smaller paddle boat if water is calm; it is quieter than the engine boats.']], meals: ['Soul on the Beach', 'Ginger & Jamu', 'Massimo Sanur'], localSecret: 'Book the return fast boat before leaving Sanur; afternoon seats sell out when day-trippers all return at once.' },
      { title: 'Sidemen Slow Roads: Weaving Villages & Besakih Shadows', emoji: 'valley', mood: 'Bali without the rush: rice valleys, craft stops, and a temple that rewards patience.', area: 'Sidemen and Besakih', activities: [['Sidemen Rice Valley Walk', 'nature', 'Sidemen, Karangasem', [-8.4678, 115.4436], '08:30', '2h', 8, 4.7, 'Hire a local guide through your guesthouse so the path supports the village directly.'], ['Besakih Mother Temple', 'temple', 'Besakih, Rendang', [-8.3739, 115.4515], '13:00', '2h', 9, 4.5, 'Use the official ticket office and ignore unofficial guide pressure in the parking area.']], meals: ['Samanvaya Rice Barn', 'Warung Tirta Unda', 'Asri Dining'], localSecret: 'The road between Sidemen and Iseh has the best Agung views; ask to stop at a warung terrace rather than a marked viewpoint.' },
      { title: 'Munduk Mist: Waterfalls, Lake Temples & Mountain Coffee', emoji: 'mist', mood: 'A cooler north-Bali day with mist, cloves, and less beach-club noise.', area: 'Munduk and Bedugul', activities: [['Banyumala Twin Waterfalls', 'waterfall', 'Wanagiri, Buleleng', [-8.2242, 115.1072], '08:00', '2h', 3, 4.8, 'Wear shoes with grip; the lower path is slippery after rain.'], ['Ulun Danu Beratan Temple', 'temple', 'Lake Beratan, Bedugul', [-8.2751, 115.1668], '12:30', '75 min', 5, 4.6, 'If tour buses arrive, walk left around the gardens for cleaner lake views.']], meals: ['Munduk Coffee Roastery', 'Warung Classic', 'Ngiring Ngewedang'], localSecret: 'Buy cloves or coffee at a family stall on the Munduk ridge; prices are fairer than tourist shops near Bedugul.' },
      { title: 'Seminyak Polished Night: Petitenget Sand & Design Stores', emoji: 'sunset', mood: 'A stylish reset with shopping, a beach walk, and one indulgent dinner.', area: 'Seminyak', activities: [['Petitenget Beach Walk', 'beach', 'Petitenget Beach, Seminyak', [-8.6793, 115.1533], '08:30', '75 min', 0, 4.4, 'Walk north toward Batu Belig for fewer vendors and wider sand.'], ['Nyaman Gallery', 'art', 'Jl. Basangkasa No.88, Seminyak', [-8.6857, 115.1636], '15:00', '60 min', 0, 4.5, 'Ask staff about Balinese artists in the back room; the strongest pieces are not always at the entrance.']], meals: ['Revolver Espresso', 'Sisterfields', 'Merah Putih'], localSecret: 'Sunset drinks are calmer one lane back from the beach; you pay less for a better conversation and can walk to the sand after.' },
      { title: 'Ubud Hands-On: Mask Carvers, Campuhan Ridge & Night Market Bites', emoji: 'craft', mood: 'A tactile day of crafts and ridgelines, with a light-footed evening food crawl.', area: 'Central Ubud', activities: [['Setia Darma House of Masks', 'culture', 'Kemenuh, Sukawati', [-8.5617, 115.2837], '10:00', '90 min', 4, 4.7, 'Call ahead through your driver; opening hours can flex around ceremonies.'], ['Campuhan Ridge Walk', 'walk', 'Jl. Bangkiang Sidem, Ubud', [-8.5036, 115.2547], '16:45', '75 min', 0, 4.5, 'Start late enough for shade but before the path is dark; bring water.']], meals: ['Pison Ubud', 'Warung Mendez', 'Siboghana Waroeng'], localSecret: 'For simple souvenirs, use the fixed-price shop behind Ubud Palace first; it calibrates you before bargaining in the market.' },
      { title: 'East Bali Mirrors: Tirta Gangga Pools & Ujung Sea Wind', emoji: 'palace', mood: 'A long but beautiful eastward day, kept focused on water palaces rather than too many stops.', area: 'Karangasem', activities: [['Tirta Gangga Water Palace', 'palace', 'Ababi, Karangasem', [-8.4116, 115.5873], '09:00', '90 min', 4, 4.6, 'Arrive before wedding-photo groups and carry small notes for fish food if you want the classic stepping-stone shot.'], ['Taman Ujung Water Palace', 'palace', 'Tumbu, Karangasem', [-8.4636, 115.6312], '12:00', '90 min', 5, 4.5, 'Climb the far pavilion for sea and mountain views in one frame.']], meals: ['Galanga Garden', 'Warung Lesehan Mina Carik', 'Vincent Nigita'], localSecret: 'Ask your driver to return via the coast road if time allows; the villages feel more local than the faster inland route.' },
      { title: 'Jimbaran Farewell: Garuda Views & Smoke on the Sand', emoji: 'farewell', mood: 'A clean final day near the airport, with culture, beach, and no risky long transfers.', area: 'Jimbaran', activities: [['Garuda Wisnu Kencana Cultural Park', 'culture', 'Jl. Raya Uluwatu, Ungasan', [-8.8105, 115.1676], '10:00', '2h', 9, 4.4, 'Use the shuttle inside the park; the scale is bigger than it looks on maps.'], ['Jimbaran Beach Seafood Stalls', 'food', 'Jimbaran Beach, Badung', [-8.7790, 115.1667], '17:30', '90 min', 28, 4.4, 'Pick a stall by seeing the fish first, then agree weight and price before sitting.']], meals: ['Cuca Bali', 'Menega Cafe', 'Kisik Bar and Grill'], localSecret: 'If flying late, leave luggage with the restaurant or a nearby spa; it is more pleasant than killing time at DPS airport.' },
    ],
  },
  'lisbon-3-days': {
    destination: { city: 'Lisbon', country: 'Portugal', countryCode: 'PT', flag: 'PT', coordinates: [38.7223, -9.1393], timezone: 'Europe/Lisbon', currency: { code: 'EUR', symbol: 'EUR', euroRate: 1 } },
    budget: { flights: [90, 180], accommodation: 210, food: 115, activities: 52, transport: 24, total: [491, 581], perPerson: [491, 581] },
    accommodation: { name: 'This Is Lisbon Hostel', area: 'Alfama', nightlyEstimate: 70 },
    flightOptions: [{ airline: 'TAP / Ryanair / easyJet', route: 'Europe to Lisbon', estimate: 130, bookingWindow: 'Book 4-7 weeks ahead for shoulder season.' }],
    nearbyEscapes: [{ name: 'Sintra', distance: '30 km', transportCost: 6, idealFor: 'palaces and misty forest', daysToAdd: 1, tip: 'Start at Pena before 9:00.' }, { name: 'Cascais', distance: '35 km', transportCost: 5, idealFor: 'coast and seafood', daysToAdd: 1, tip: 'Sit on the left side of the train for river views.' }],
    suggestions: ['Add Sintra', 'Make it cheaper', 'Add more viewpoints'],
    days: [
      { title: 'Alfama First Notes: Tiles, Fado Lanes & Miradouro Light', emoji: 'tiles', mood: 'A walkable arrival through Lisbon layers, with viewpoints placed before the steepest fatigue.', area: 'Alfama', activities: [['Se Cathedral and Alfama Lanes', 'history', 'Largo da Se, Lisboa', [38.7098, -9.1334], '09:30', '90 min', 0, 4.5, 'Start downhill from the cathedral so the climb is not punishing.'], ['Miradouro da Graca', 'viewpoint', 'Calcada da Graca, Lisboa', [38.7162, -9.1315], '16:30', '60 min', 0, 4.7, 'Buy a drink from the kiosk and sit on the wall before sunset crowds.']], meals: ['Copenhagen Coffee Lab Alfama', 'O Velho Eurico', 'Tasca do Chico'], localSecret: 'Use the public elevator inside Pingo Doce Chao do Loureiro to save your legs between Baixa and the castle hill.' },
      { title: 'River Machines: Belem Monuments & Alcantara Warehouses', emoji: 'river', mood: 'A low-cost riverside day that pairs maritime history with creative Lisbon.', area: 'Belem and Alcantara', activities: [['Jeronimos Monastery Exterior and Church', 'history', 'Praca do Imperio, Lisboa', [38.6979, -9.2068], '09:00', '75 min', 0, 4.7, 'The church is free and often enough if the cloister queue is huge.'], ['LX Factory Bookstore and Street Art', 'design', 'Rua Rodrigues de Faria 103, Lisboa', [38.7030, -9.1782], '14:30', '90 min', 0, 4.4, 'Climb to the Rio Maravilha terrace even if you do not drink there.']], meals: ['Manteigaria Belem', 'Pao Pao Queijo Queijo', 'Taberna da Rua das Flores'], localSecret: 'Walk from MAAT to Belem Tower along the river only in the morning; afternoon sun and wind make it feel twice as long.' },
      { title: 'Final Blue Tiles: Mouraria Breakfast & Bairro Alto Goodbyes', emoji: 'view', mood: 'A final loop through working neighborhoods, azulejos, and a last golden-hour lookout.', area: 'Mouraria and Chiado', activities: [['Mouraria Street Walk', 'culture', 'Largo da Severa, Lisboa', [38.7164, -9.1350], '09:30', '90 min', 0, 4.5, 'Look for the fado portraits on Rua do Capelao and keep your camera discreet.'], ['National Tile Museum', 'museum', 'Rua Madre de Deus 4, Lisboa', [38.7242, -9.1139], '14:00', '90 min', 8, 4.7, 'Do not miss the panoramic pre-earthquake Lisbon tile upstairs.']], meals: ['Dear Breakfast Chiado', 'Zezinho da Mouraria', 'Jesus e Goes'], localSecret: 'For a cheap final viewpoint, use the top floor of Armazens do Chiado at dusk; it is less romantic but very practical.' },
    ],
  },
  'new-york-4-days': {
    destination: { city: 'New York', country: 'United States', countryCode: 'US', flag: 'US', coordinates: [40.7128, -74.0060], timezone: 'America/New_York', currency: { code: 'USD', symbol: 'USD', euroRate: 0.92 } },
    budget: { flights: [420, 720], accommodation: 1480, food: 760, activities: 540, transport: 136, total: [3336, 3636], perPerson: [1668, 1818] },
    accommodation: { name: 'The Marlton Hotel', area: 'Greenwich Village', nightlyEstimate: 370 },
    flightOptions: [{ airline: 'Delta / United / TAP', route: 'Europe to JFK or EWR', estimate: 560, bookingWindow: 'Book 8-12 weeks ahead; avoid Thanksgiving week.' }],
    nearbyEscapes: [{ name: 'Hudson Valley', distance: '90 min train', transportCost: 32, idealFor: 'river towns and galleries', daysToAdd: 1, tip: 'Beacon is easiest without a car.' }, { name: 'Philadelphia', distance: '95 min train', transportCost: 44, idealFor: 'architecture and museums', daysToAdd: 1, tip: 'Use Amtrak early fares or bus if budget matters.' }],
    suggestions: ['Add jazz clubs', 'Make this less expensive', 'Add Brooklyn architecture'],
    days: [
      { title: 'Stone and Skyline: Village Corners & One World Blue Hour', emoji: 'skyline', mood: 'Architectural New York from brownstones to glass, with meals that justify the premium spend.', area: 'Village and Lower Manhattan', activities: [['West Village Architecture Walk', 'architecture', '75 1/2 Bedford St, New York', [40.7322, -74.0051], '09:30', '90 min', 0, 4.6, 'Start on Grove Street before brunch crowds; the narrowest house is just a marker, not the whole point.'], ['One World Observatory', 'viewpoint', '117 West St, New York', [40.7130, -74.0132], '17:30', '90 min', 44, 4.5, 'Book blue hour, not midday; the harbor and bridges read better.']], meals: ['Daily Provisions', 'Loring Place', 'Manhatta'], localSecret: 'For a free skyline reset, walk the Irish Hunger Memorial just before One World; it is quiet and strangely moving.' },
      { title: 'Museum Mile Precision: Met Rooms & Central Park Shadows', emoji: 'museum', mood: 'A polished culture day with a strict museum edit and one slow park section.', area: 'Upper East Side', activities: [['Metropolitan Museum of Art Focus Route', 'museum', '1000 5th Ave, New York', [40.7794, -73.9632], '10:00', '2h 30 min', 30, 4.8, 'Pick Greek court, Temple of Dendur, and European paintings; leave before fatigue wins.'], ['Central Park Ramble', 'park', 'Ramble, Central Park', [40.7772, -73.9694], '15:00', '75 min', 0, 4.7, 'Enter near Belvedere Castle and let yourself get slightly lost.']], meals: ['Sant Ambroeus Madison', 'Cafe Sabarsky', 'Bemelmans Bar'], localSecret: 'The Met balcony bar is seasonal but worth checking; it gives a calmer pause than the crowded front steps.' },
      { title: 'Bridges and Brick: DUMBO Angles & Brooklyn Tables', emoji: 'bridge', mood: 'A Brooklyn day that earns its postcard views with good walking and better food.', area: 'Brooklyn', activities: [['Brooklyn Bridge Sunrise Walk', 'walk', 'Brooklyn Bridge Promenade', [40.7061, -73.9969], '08:00', '60 min', 0, 4.8, 'Walk from Brooklyn toward Manhattan for the better skyline reveal.'], ['Brooklyn Heights Promenade', 'architecture', 'Montague St & Pierrepont Pl, Brooklyn', [40.6983, -73.9967], '11:00', '60 min', 0, 4.7, 'Use the fruit streets for brownstones before the promenade view.']], meals: ['Butler DUMBO', 'Juliana Pizza', 'The River Cafe'], localSecret: 'Skip the crowded Washington Street photo scrum after one quick look; Plymouth Street gives better bridge texture and fewer elbows.' },
      { title: 'After-Dark Manhattan: High Line Steel & Jazz Below Street Level', emoji: 'jazz', mood: 'A final day of design, food halls, and nightlife that feels grown-up rather than frantic.', area: 'Chelsea and Midtown', activities: [['High Line North-to-South Walk', 'design', 'The High Line, New York', [40.7480, -74.0048], '10:00', '90 min', 0, 4.6, 'Start at Hudson Yards and walk south so Chelsea Market lands at lunch.'], ['Village Vanguard Jazz Set', 'nightlife', '178 7th Ave S, New York', [40.7360, -74.0017], '20:30', '2h', 45, 4.8, 'Reserve ahead and arrive early; sightlines matter in the basement room.']], meals: ['La Cabra NYC', 'Los Tacos No.1 Chelsea Market', 'Via Carota'], localSecret: 'If Chelsea Market is packed, exit to 15th Street and use the smaller Los Tacos line near the side entrance.' },
    ],
  },
  'rome-4-days': {
    destination: { city: 'Rome', country: 'Italy', countryCode: 'IT', flag: 'IT', coordinates: [41.9028, 12.4964], timezone: 'Europe/Rome', currency: { code: 'EUR', symbol: 'EUR', euroRate: 1 } },
    budget: { flights: [160, 320], accommodation: 620, food: 360, activities: 260, transport: 42, total: [1442, 1602], perPerson: [481, 534] },
    accommodation: { name: 'Hotel Santa Maria', area: 'Trastevere', nightlyEstimate: 155 },
    flightOptions: [{ airline: 'ITA / Vueling / Ryanair', route: 'Europe to Fiumicino or Ciampino', estimate: 220, bookingWindow: 'Book 6-8 weeks ahead; school breaks fill quickly.' }],
    nearbyEscapes: [{ name: 'Ostia Antica', distance: '45 min train', transportCost: 3, idealFor: 'ancient ruins with space', daysToAdd: 1, tip: 'Bring water; shade is limited.' }, { name: 'Tivoli', distance: '1 h train', transportCost: 7, idealFor: 'Villa d Este fountains', daysToAdd: 1, tip: 'Pair with Hadrians Villa only if kids have stamina.' }],
    suggestions: ['Add a Vatican early-entry plan', 'Make it easier with children', 'Add more gelato stops'],
    days: [
      { title: 'Ancient Stones, Small Steps: Colosseum Morning & Monti Pasta', emoji: 'ancient', mood: 'A family-paced first day through Rome icons, with shade, snacks, and no forced marathon.', area: 'Colosseum and Monti', activities: [['Colosseum Arena Timed Entry', 'history', 'Piazza del Colosseo 1, Roma', [41.8902, 12.4922], '09:00', '2h', 18, 4.8, 'Use a timed arena ticket and explain gladiator logistics before entering; kids engage faster.'], ['Roman Forum View from Campidoglio', 'viewpoint', 'Piazza del Campidoglio, Roma', [41.8933, 12.4829], '12:00', '45 min', 0, 4.7, 'The terrace behind the museums gives a free Forum overview without another ticket queue.']], meals: ['Barnum Cafe', 'La Taverna dei Fori Imperiali', 'Urbana 47'], localSecret: 'The small playground at Parco del Colle Oppio is a useful reset after the Colosseum and before lunch in Monti.' },
      { title: 'Fountains and Caravaggio: Centro Storico Without the Crush', emoji: 'fountain', mood: 'Rome postcard sights routed early, then cooler churches and gelato breaks.', area: 'Centro Storico', activities: [['Pantheon Early Visit', 'history', 'Piazza della Rotonda, Roma', [41.8986, 12.4769], '09:00', '60 min', 5, 4.8, 'Book online and enter early; the oculus is best before crowds heat the square.'], ['San Luigi dei Francesi Caravaggios', 'art', 'Piazza di S. Luigi de Francesi, Roma', [41.8993, 12.4747], '11:00', '45 min', 0, 4.7, 'Bring a one-euro coin for the light box if needed; the chapel is small but unforgettable.']], meals: ['Sant Eustachio Il Caffe', 'Armando al Pantheon', 'Emma Pizzeria'], localSecret: 'Trevi Fountain is calmer before 08:00 or after 22:30; with family, go late only if everyone has had a proper rest.' },
      { title: 'Vatican Blue and Borgo Calm: Museums, Dome Views & Prati Supper', emoji: 'vatican', mood: 'A high-demand day made humane with early entry, a focused route, and nearby meals.', area: 'Vatican and Prati', activities: [['Vatican Museums Family Route', 'museum', 'Viale Vaticano, Roma', [41.9065, 12.4536], '08:30', '2h 30 min', 25, 4.7, 'Do maps room, Raphael rooms, Sistine Chapel; skip trying to see every corridor.'], ['St Peters Square and Basilica', 'landmark', 'Piazza San Pietro, Vatican City', [41.9022, 12.4539], '12:00', '90 min', 0, 4.8, 'Dress code is enforced; shoulders and knees covered keeps the day smooth.']], meals: ['Sciascia Caffe 1919', 'Pizzarium Bonci', 'Il Sorpasso'], localSecret: 'If the basilica security line is brutal, take the kids for shade under Berninis colonnade and try again after lunch.' },
      { title: 'Trastevere Golden Hour: Markets, Islands & Family Table Wine', emoji: 'trastevere', mood: 'A slower finale through food markets, river crossings, and a neighborhood dinner.', area: 'Testaccio and Trastevere', activities: [['Testaccio Market Tasting Loop', 'food', 'Via Aldo Manuzio 66b, Roma', [41.8777, 12.4743], '10:00', '90 min', 18, 4.6, 'Share supplì, trapizzino, and fresh fruit instead of committing to one big lunch.'], ['Tiber Island Crossing', 'walk', 'Isola Tiberina, Roma', [41.8903, 12.4770], '16:30', '45 min', 0, 4.5, 'Use the island as a scenic pause before Trastevere gets busy.']], meals: ['Tram Depot Testaccio', 'Mordi e Vai', 'Da Enzo al 29'], localSecret: 'For a calmer Trastevere photo, use Vicolo dell Atleta before dinner; the main lanes near Santa Maria fill fast.' },
    ],
  },
};

function parseArgs(argv) {
  const args = { mode: 'auto', destination: null, seed: false, quiet: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--fixtures') args.mode = 'fixtures';
    else if (arg === '--live') args.mode = 'live';
    else if (arg === '--seed-fixtures') args.seed = true;
    else if (arg === '--quiet') args.quiet = true;
    else if (arg === '--destination') {
      args.destination = argv[i + 1] || null;
      i += 1;
    } else if (arg.startsWith('--destination=')) {
      args.destination = arg.split('=').slice(1).join('=');
    }
  }
  return args;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function slug(value) {
  return String(value || '').toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ').trim();
}

function getBounds(destination) {
  const key = slug(destination);
  return BOUNDS[key] || BOUNDS[key.replace(/\s+/g, '')] || null;
}

function coordinatePair(value) {
  if (Array.isArray(value) && value.length >= 2) return [Number(value[0]), Number(value[1])];
  if (value && typeof value === 'object') {
    const lat = value.lat ?? value.latitude;
    const lng = value.lng ?? value.lon ?? value.longitude;
    if (lat !== undefined && lng !== undefined) return [Number(lat), Number(lng)];
  }
  return null;
}

function isZeroCoord(pair) {
  return pair && Number(pair[0]) === 0 && Number(pair[1]) === 0;
}

function inBounds(pair, bounds) {
  if (!pair || !bounds) return false;
  const [lat, lng] = pair;
  return Number.isFinite(lat) && Number.isFinite(lng)
    && lat >= bounds.latMin && lat <= bounds.latMax
    && lng >= bounds.lngMin && lng <= bounds.lngMax;
}

function haversineKm(a, b) {
  if (!a || !b) return Infinity;
  const toRad = (deg) => deg * Math.PI / 180;
  const r = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function isGenericText(value) {
  const text = String(value || '').toLowerCase();
  return !text || text.length < 45 || GENERIC_TEXT.some((phrase) => text.includes(phrase));
}

function titleQuality(title) {
  const text = String(title || '').trim();
  if (!text) return 0;
  if (BANNED_TITLE_PATTERNS.some((pattern) => pattern.test(text))) return 0;
  let score = 0;
  if (text.length >= 24 && text.length <= 95) score += 25;
  if (/[:\-&]/.test(text)) score += 20;
  if (/\b(first|last|neon|river|market|temple|museum|garden|palace|ridge|dawn|blue|gold|night|ancient|hidden|clifftop|water|stone|skyline|courtyard|backstreets)\b/i.test(text)) score += 25;
  if (/\b[A-Z][a-z]{3,}\b.*\b[A-Z][a-z]{3,}\b/.test(text)) score += 15;
  if (!/^(arrival|sightseeing|free day|city tour)$/i.test(text)) score += 15;
  return Math.min(score, 100);
}

function extractActivities(day) {
  if (!day || typeof day !== 'object') return [];
  const fromPeriods = [];
  if (day.periods && typeof day.periods === 'object') {
    for (const periodName of ['morning', 'afternoon', 'evening']) {
      const activities = day.periods[periodName]?.activities;
      if (Array.isArray(activities)) {
        activities.forEach((activity) => fromPeriods.push({ ...activity, period: activity.period || periodName }));
      }
    }
  }
  if (fromPeriods.length > 0) return fromPeriods;
  if (Array.isArray(day.activities)) return day.activities;
  if (Array.isArray(day.stops)) return day.stops;
  return [];
}

function budgetNumber(value) {
  if (typeof value === 'number') return value;
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + budgetNumber(item), 0);
  if (value && typeof value === 'object') {
    if (typeof value.total === 'number') return value.total;
    if (typeof value.min === 'number') return value.min;
    return Object.values(value).reduce((sum, item) => sum + (typeof item === 'number' ? item : 0), 0);
  }
  const parsed = parseFloat(String(value || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function addScore(section, raw, max) {
  return Math.max(0, Math.min(max, raw));
}

function evaluateItinerary(data, testCase) {
  const result = {
    id: testCase.id,
    destination: testCase.destination,
    daysRequested: testCase.days,
    score: 0,
    passed: false,
    fatal: [],
    failures: [],
    warnings: [],
    sections: {},
  };

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    result.fatal.push('Output is not a JSON object');
    return result;
  }

  const bounds = getBounds(testCase.destination);
  const destination = data.destination || {};
  const trip = data.trip || {};
  const days = Array.isArray(data.days) ? data.days : [];

  let schema = 20;
  const requiredDestination = ['city', 'country', 'countryCode', 'flag', 'coordinates', 'timezone', 'currency'];
  requiredDestination.forEach((field) => {
    if (!destination[field]) {
      schema -= 2;
      result.failures.push(`Destination missing ${field}`);
    }
  });
  const destinationCoords = coordinatePair(destination.coordinates);
  if (!destinationCoords) result.failures.push('Destination coordinates missing or invalid');
  if (isZeroCoord(destinationCoords)) result.fatal.push('Destination coordinates are [0,0]');
  if (bounds && destinationCoords && !inBounds(destinationCoords, bounds)) result.fatal.push('Destination coordinates outside expected bounds');

  if (Number(trip.totalDays) !== testCase.days) {
    schema -= 3;
    result.fatal.push(`Trip totalDays ${trip.totalDays} does not match requested ${testCase.days}`);
  }
  ['travelStyle', 'budgetTier', 'budgetBreakdown'].forEach((field) => {
    if (!trip[field]) {
      schema -= 2;
      result.failures.push(`Trip missing ${field}`);
    }
  });
  if (!Array.isArray(trip.topTips) || trip.topTips.length < 3) {
    schema -= 2;
    result.failures.push('Trip topTips must include at least 3 items');
  }
  if (days.length !== testCase.days) {
    schema -= 5;
    result.fatal.push(`Missing days: expected ${testCase.days}, received ${days.length}`);
  }
  result.sections.schema = addScore('schema', schema, 20);

  let coordinateScore = 20;
  let titleScore = 10;
  let logisticsScore = 15;
  let activityScore = 15;
  let mealScore = 10;
  let secretScore = 5;
  const titleSet = new Set();

  days.forEach((day, dayIndex) => {
    const dayNumber = Number(day.dayNumber);
    if (dayNumber !== dayIndex + 1) {
      result.failures.push(`Day ${dayIndex + 1} has invalid dayNumber`);
      schema -= 1;
    }

    const title = String(day.title || '').trim();
    const titleKey = title.toLowerCase();
    const quality = titleQuality(title);
    if (!title) result.failures.push(`Day ${dayIndex + 1} missing title`);
    if (titleSet.has(titleKey)) result.fatal.push(`Duplicate day title: ${title}`);
    titleSet.add(titleKey);
    if (BANNED_TITLE_PATTERNS.some((pattern) => pattern.test(title))) result.fatal.push(`Banned generic day title: ${title}`);
    if (quality < 60) {
      titleScore -= 1.5;
      result.failures.push(`Day ${dayIndex + 1} title quality too weak: ${title}`);
    }

    ['emoji', 'moodDescription', 'budgetEstimate', 'weather', 'transport', 'periods'].forEach((field) => {
      if (!day[field]) result.failures.push(`Day ${dayIndex + 1} missing ${field}`);
    });

    const activities = extractActivities(day);
    if (activities.length === 0) {
      result.fatal.push(`Day ${dayIndex + 1} has no map-critical activities`);
      activityScore -= 3;
    }
    if (activities.length > 4 && !day.activityCountJustification) {
      activityScore -= 2;
      result.failures.push(`Day ${dayIndex + 1} has more than 4 major activities`);
    }

    let previousCoords = null;
    activities.forEach((activity, activityIndex) => {
      const label = `Day ${dayIndex + 1} activity ${activityIndex + 1}`;
      ['id', 'name', 'type', 'address', 'startTime', 'duration', 'cost', 'insiderTip'].forEach((field) => {
        if (activity[field] === undefined || activity[field] === '') {
          activityScore -= 0.4;
          result.failures.push(`${label} missing ${field}`);
        }
      });
      const coords = coordinatePair(activity.coordinates);
      if (!coords) {
        coordinateScore -= 2;
        result.fatal.push(`${label} missing coordinates`);
      } else if (isZeroCoord(coords)) {
        coordinateScore -= 4;
        result.fatal.push(`${label} coordinates are [0,0]`);
      } else if (bounds && !inBounds(coords, bounds)) {
        coordinateScore -= 4;
        result.fatal.push(`${label} coordinates outside ${testCase.destination} bounds`);
      }

      const rating = Number(activity.rating);
      if (!Number.isFinite(rating) || rating < 4.0 || rating > 5.0) {
        activityScore -= 0.5;
        result.failures.push(`${label} rating must be between 4.0 and 5.0`);
      }
      if (isGenericText(activity.insiderTip)) {
        activityScore -= 0.5;
        result.failures.push(`${label} insiderTip is too generic`);
      }
      if (!activity.photoKeyword) {
        activityScore -= 0.3;
        result.failures.push(`${label} missing photoKeyword`);
      }
      if (activityIndex > 0) {
        const transport = activity.transportFromPrevious || {};
        ['mode', 'line', 'duration', 'cost', 'directions'].forEach((field) => {
          if (transport[field] === undefined || transport[field] === '') {
            logisticsScore -= 0.4;
            result.failures.push(`${label} transportFromPrevious missing ${field}`);
          }
        });
      }
      if (previousCoords && coords) {
        const distance = haversineKm(previousCoords, coords);
        const threshold = testCase.destination === 'Bali' ? 45 : 18;
        if (distance > threshold) {
          logisticsScore -= 1;
          result.warnings.push(`${label} is ${distance.toFixed(1)}km from previous activity; check routing`);
        }
      }
      if (coords) previousCoords = coords;
    });

    const meals = day.meals || {};
    if (!('breakfast' in meals)) result.failures.push(`Day ${dayIndex + 1} breakfast missing or not intentionally null`);
    ['lunch', 'dinner'].forEach((mealName) => {
      const meal = meals[mealName];
      if (!meal) {
        mealScore -= 1;
        result.failures.push(`Day ${dayIndex + 1} ${mealName} missing`);
        return;
      }
      ['name', 'mustOrder', 'insiderNote', 'cost', 'address', 'coordinates'].forEach((field) => {
        if (meal[field] === undefined || meal[field] === '') {
          mealScore -= 0.3;
          result.failures.push(`Day ${dayIndex + 1} ${mealName} missing ${field}`);
        }
      });
      if (/^(restaurant|lunch|dinner|local spot)$/i.test(String(meal.name || '').trim())) {
        mealScore -= 0.7;
        result.failures.push(`Day ${dayIndex + 1} ${mealName} name is generic`);
      }
      const coords = coordinatePair(meal.coordinates);
      if (!coords || isZeroCoord(coords) || (bounds && !inBounds(coords, bounds))) {
        coordinateScore -= 0.5;
        result.failures.push(`Day ${dayIndex + 1} ${mealName} coordinates invalid`);
      }
    });

    const secret = typeof day.localSecret === 'string' ? day.localSecret : day.localSecret?.tip;
    if (isGenericText(secret) || String(secret || '').length < 70) {
      secretScore -= 0.5;
      result.failures.push(`Day ${dayIndex + 1} localSecret is not specific/actionable enough`);
    }
  });

  const budget = trip.budgetBreakdown || {};
  let budgetScore = 5;
  const categories = ['flights', 'accommodation', 'food', 'activities', 'transport', 'grandTotal'];
  categories.forEach((category) => {
    const value = budgetNumber(budget[category]);
    if (!Number.isFinite(value) || value < 0) {
      budgetScore -= 0.6;
      result.failures.push(`Budget ${category} missing, implausible, or negative`);
    }
  });
  if (!budget.perPersonEstimate && !trip.perPersonEstimate) {
    budgetScore -= 0.7;
    result.failures.push('Budget per-person estimate missing');
  }

  const nearby = Array.isArray(data.nearbyEscapes) ? data.nearbyEscapes : [];
  if (nearby.length < 2) {
    budgetScore -= 0.5;
    result.failures.push('nearbyEscapes should include at least 2 options');
  } else {
    nearby.slice(0, 2).forEach((escapeItem, index) => {
      ['name', 'distance', 'transportCost', 'idealFor', 'tip'].forEach((field) => {
        if (!escapeItem[field]) {
          budgetScore -= 0.1;
          result.failures.push(`Nearby escape ${index + 1} missing ${field}`);
        }
      });
    });
  }

  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
  if (suggestions.length < 3 || suggestions.some((item) => String(item || '').length < 8)) {
    budgetScore -= 0.5;
    result.failures.push('Suggestions should include at least 3 useful chips');
  }

  result.sections.coordinates = addScore('coordinates', coordinateScore, 20);
  result.sections.dayTitles = addScore('dayTitles', titleScore, 10);
  result.sections.logistics = addScore('logistics', logisticsScore, 15);
  result.sections.activities = addScore('activities', activityScore, 15);
  result.sections.meals = addScore('meals', mealScore, 10);
  result.sections.localSecrets = addScore('localSecrets', secretScore, 5);
  result.sections.budgetPlanning = addScore('budgetPlanning', budgetScore, 5);

  result.score = Math.round(Object.values(result.sections).reduce((sum, value) => sum + value, 0));
  if (result.score < 85) result.failures.push(`Score ${result.score} is below launch threshold 85`);
  result.passed = result.fatal.length === 0 && result.score >= 85;
  return result;
}

function makeMeal(name, city, coords, mealType, cost) {
  return {
    name,
    cuisine: mealType === 'breakfast' ? 'Cafe and bakery' : 'Local restaurant',
    type: mealType,
    priceRange: cost > 30 ? '$$$' : cost > 15 ? '$$' : '$',
    cost,
    address: `${name}, ${city}`,
    coordinates: coords,
    mustOrder: mealType === 'breakfast' ? 'house coffee and signature pastry' : 'signature seasonal plate',
    openingHours: mealType === 'dinner' ? '18:30-22:30' : '08:00-15:00',
    bookingRequired: mealType === 'dinner',
    insiderNote: `Ask for the counter or window seat at ${name}; staff usually steer regulars there first.`,
  };
}

function makeActivity(caseId, dayNumber, item, index) {
  const [name, type, address, coordinates, startTime, duration, cost, rating, insiderTip] = item;
  return {
    id: `${caseId}-d${dayNumber}-a${index + 1}`,
    name,
    type,
    emoji: type,
    address,
    coordinates,
    startTime,
    duration,
    cost,
    rating,
    crowd: index === 0 ? 'low early' : 'moderate',
    bookingRequired: cost >= 10,
    insiderTip,
    photoKeyword: `${name} travel`,
    transportFromPrevious: index === 0
      ? { mode: 'walk', line: 'hotel start', duration: '12 min', cost: 0, directions: 'Start from the recommended base area and keep the first leg simple.' }
      : { mode: 'metro or taxi', line: 'direct local route', duration: '18 min', cost: 3, directions: `Travel directly to ${name} without crossing back through the hotel area.` },
  };
}

function buildFixture(caseDef) {
  const blueprint = FIXTURE_BLUEPRINTS[caseDef.id];
  if (!blueprint) throw new Error(`No fixture blueprint for ${caseDef.id}`);
  const city = blueprint.destination.city;
  const days = blueprint.days.map((day, index) => {
    const activities = day.activities.map((item, activityIndex) => makeActivity(caseDef.id, index + 1, item, activityIndex));
    const [breakfast, lunch, dinner] = day.meals;
    const breakfastCoords = activities[0]?.coordinates || blueprint.destination.coordinates;
    const lunchCoords = activities[1]?.coordinates || activities[0]?.coordinates || blueprint.destination.coordinates;
    const dinnerCoords = activities[activities.length - 1]?.coordinates || blueprint.destination.coordinates;
    return {
      dayNumber: index + 1,
      title: day.title,
      emoji: day.emoji,
      theme: day.area,
      moodDescription: day.mood,
      budgetEstimate: activities.reduce((sum, activity) => sum + Number(activity.cost || 0), 0) + 55,
      weather: { avgTemp: caseDef.destination === 'Bali' ? '28C' : '19C', condition: 'Seasonally comfortable', emoji: 'clear', practicalTip: 'Carry water and keep one flexible indoor option.' },
      transport: { mainRecommendation: 'Use public transport plus short walks', dayPassRecommendation: 'Buy a day pass only if making 3+ rides', approximateDailyCost: 8, cost: 8, details: 'Activities are grouped by area to avoid backtracking.' },
      periods: {
        morning: { timeRange: '08:00-12:00', activities: activities.slice(0, 1) },
        afternoon: { timeRange: '13:00-17:00', activities: activities.slice(1, 2) },
        evening: { timeRange: '18:00-22:00', activities: activities.slice(2) },
      },
      activities,
      stops: activities,
      meals: {
        breakfast: makeMeal(breakfast, city, breakfastCoords, 'breakfast', 9),
        lunch: makeMeal(lunch, city, lunchCoords, 'lunch', 18),
        dinner: makeMeal(dinner, city, dinnerCoords, 'dinner', 36),
      },
      localSecret: day.localSecret,
      culturalNote: `In ${day.area}, move quietly around residential lanes and check opening hours on the morning of the visit.`,
      dayHighlight: activities[0]?.name || day.title,
      estimatedSteps: 11000,
      packingForDay: ['comfortable shoes', 'portable battery', 'light layer'],
    };
  });

  return {
    destination: blueprint.destination,
    trip: {
      totalDays: caseDef.days,
      travelStyle: caseDef.travelStyle,
      groupType: caseDef.groupType,
      budgetTier: caseDef.budgetTier,
      startDate: '2026-10-12',
      endDate: '2026-10-18',
      budgetBreakdown: {
        flights: { min: blueprint.budget.flights[0], max: blueprint.budget.flights[1] },
        accommodation: { total: blueprint.budget.accommodation },
        food: { total: blueprint.budget.food },
        activities: { total: blueprint.budget.activities },
        transport: { total: blueprint.budget.transport },
        grandTotal: { min: blueprint.budget.total[0], max: blueprint.budget.total[1] },
        perPersonEstimate: { min: blueprint.budget.perPerson[0], max: blueprint.budget.perPerson[1] },
        currency: 'EUR',
      },
      topTips: [
        'Book the highest-demand activity before flights if dates are fixed.',
        'Keep one late afternoon unplanned every two days.',
        'Use the first morning for the busiest landmark.',
      ],
    },
    summary: { title: `${city} launch-readiness fixture`, andorVerdict: `A realistic, logistics-aware ${caseDef.days}-day plan for ${city}.` },
    budgetBreakdown: blueprint.budget,
    flightOptions: blueprint.flightOptions,
    accommodation: blueprint.accommodation,
    days,
    weather: { season: 'shoulder season', practicalTip: 'Pack layers and verify weather 48 hours before departure.' },
    transport: { overview: 'Area-grouped days with direct routes between adjacent stops.' },
    packingList: { essential: ['passport', 'insurance', 'portable charger'], weatherSpecific: ['light rain shell'], appsMustHave: ['Google Maps', 'local transit app'], doNotBring: ['oversized luggage'] },
    nearbyEscapes: blueprint.nearbyEscapes,
    andorInsights: ['This route protects mornings for high-demand places.', 'Meal choices stay near the day route.', 'The plan avoids repeated cross-city transfers.'],
    suggestions: blueprint.suggestions,
  };
}

function seedFixtures() {
  ensureDir(FIXTURE_DIR);
  for (const testCase of TEST_CASES) {
    const fixturePath = path.join(FIXTURE_DIR, testCase.fixture);
    fs.writeFileSync(fixturePath, `${JSON.stringify(buildFixture(testCase), null, 2)}\n`, 'utf8');
  }
}

function loadFixture(testCase) {
  const fixturePath = path.join(FIXTURE_DIR, testCase.fixture);
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Missing fixture ${path.relative(ROOT, fixturePath)}. Run: node scripts/eval-itineraries.js --seed-fixtures`);
  }
  const text = fs.readFileSync(fixturePath, 'utf8');
  return JSON.parse(text);
}

function providerEnvAvailable() {
  return Boolean(process.env.GROQ_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

async function fetchLiveItinerary(testCase) {
  if (!providerEnvAvailable()) {
    throw new Error('Live eval requires GROQ_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY.');
  }
  const baseUrl = process.env.ANDOR_EVAL_BASE_URL || process.env.EVAL_BASE_URL;
  if (!baseUrl) {
    throw new Error('Live eval requires ANDOR_EVAL_BASE_URL or EVAL_BASE_URL pointing at a running Andor app, for example http://localhost:3000.');
  }
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/generate-itinerary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destination: testCase.destination,
      days: testCase.days,
      budget: testCase.budgetTier,
      travelers: testCase.groupType,
      style: testCase.travelStyle,
      locale: 'pt',
    }),
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`Live API returned non-JSON response (${response.status})`);
  }
  if (!response.ok) {
    throw new Error(parsed?.error?.message || parsed?.error || `Live API failed with ${response.status}`);
  }
  return parsed;
}

function writeReports(results, mode) {
  ensureDir(REPORT_DIR);
  const generatedAt = new Date().toISOString();
  const payload = { generatedAt, mode, threshold: 85, results };
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const lines = [
    '# Itinerary Evaluation Report',
    '',
    `Generated: ${generatedAt}`,
    `Mode: ${mode}`,
    `Threshold: 85`,
    '',
    '| Destination | Days | Score | Result |',
    '| --- | ---: | ---: | --- |',
  ];
  results.forEach((result) => {
    lines.push(`| ${result.destination} | ${result.daysRequested} | ${result.score} | ${result.passed ? 'PASS' : 'FAIL'} |`);
  });
  lines.push('');
  results.forEach((result) => {
    lines.push(`## ${result.destination} ${result.daysRequested} days: ${result.score} ${result.passed ? 'PASS' : 'FAIL'}`);
    if (result.fatal.length || result.failures.length || result.warnings.length) {
      [...result.fatal.map((item) => `FATAL: ${item}`), ...result.failures, ...result.warnings.map((item) => `Warning: ${item}`)].forEach((item) => {
        lines.push(`- ${item}`);
      });
    } else {
      lines.push('- No failures.');
    }
    lines.push('');
  });
  fs.writeFileSync(REPORT_MD, `${lines.join('\n')}\n`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.seed) {
    seedFixtures();
    if (!args.quiet) process.stdout.write(`Seeded ${TEST_CASES.length} itinerary fixtures in ${path.relative(ROOT, FIXTURE_DIR)}\n`);
    return;
  }

  const cases = TEST_CASES.filter((testCase) => {
    if (!args.destination) return true;
    return slug(testCase.destination).includes(slug(args.destination)) || slug(testCase.id).includes(slug(args.destination));
  });

  if (cases.length === 0) {
    throw new Error(`No itinerary eval case matches destination "${args.destination}"`);
  }

  let mode = args.mode;
  if (mode === 'auto') {
    mode = providerEnvAvailable() && (process.env.ANDOR_EVAL_BASE_URL || process.env.EVAL_BASE_URL) ? 'live' : 'fixtures';
  }
  if (mode === 'live' && !providerEnvAvailable()) {
    throw new Error('Live eval requested but GROQ_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY is unavailable. Use --fixtures to validate saved outputs.');
  }

  const results = [];
  for (const testCase of cases) {
    try {
      const data = mode === 'live' ? await fetchLiveItinerary(testCase) : loadFixture(testCase);
      results.push(evaluateItinerary(data, testCase));
    } catch (error) {
      results.push({
        id: testCase.id,
        destination: testCase.destination,
        daysRequested: testCase.days,
        score: 0,
        passed: false,
        fatal: [error.message],
        failures: [],
        warnings: [],
        sections: {},
      });
    }
  }

  writeReports(results, mode);
  if (!args.quiet) {
    console.table(results.map((result) => ({
      Destination: `${result.destination} ${result.daysRequested} days`,
      Score: result.score,
      Result: result.passed ? 'PASS' : 'FAIL',
      Fatal: result.fatal.length,
      Issues: result.failures.length,
    })));
    results.forEach((result) => {
      process.stdout.write(`${result.destination} ${result.daysRequested} days: ${result.score} ${result.passed ? 'PASS' : 'FAIL'}\n`);
      const reasons = [...result.fatal, ...result.failures];
      if (reasons.length) {
        process.stdout.write('Reasons:\n');
        reasons.slice(0, 12).forEach((reason) => process.stdout.write(`- ${reason}\n`));
      }
    });
    process.stdout.write(`Reports written to ${path.relative(ROOT, REPORT_JSON)} and ${path.relative(ROOT, REPORT_MD)}\n`);
  }

  if (results.some((result) => !result.passed)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(`Itinerary eval failed: ${error.message}\n`);
  process.exit(1);
});
