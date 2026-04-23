import * as Crypto from 'expo-crypto';
import { db } from './client';
import { activitiesTable, categoriesTable, targetsTable, tripsTable, usersTable } from './schema';

export async function seedIfEmpty() {
  const existingUsers = await db.select().from(usersTable);
  if (existingUsers.length > 0) return;

  const passwordHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, 'demo1234');
  const [user] = await db.insert(usersTable).values({
    name: 'Molly',
    email: 'demo@aistear.com',
    passwordHash,
    createdAt: new Date().toISOString(),
  }).returning();

  const [food, sightseeing, nightlife, nature, shopping, relaxation] = await db
    .insert(categoriesTable)
    .values([
      { name: 'Food & Drink',       color: '#FF6B6B', icon: 'restaurant', userId: user.id },
      { name: 'Sightseeing',        color: '#54A0FF', icon: 'compass',    userId: user.id },
      { name: 'Nightlife',          color: '#5F27CD', icon: 'musical-notes', userId: user.id },
      { name: 'Nature & Outdoors',  color: '#1DD1A1', icon: 'leaf',       userId: user.id },
      { name: 'Shopping',           color: '#FF9F43', icon: 'bag',        userId: user.id },
      { name: 'Relaxation',         color: '#48DBFB', icon: 'sunny',      userId: user.id },
    ])
    .returning();

  const [hen, girls, staycation, anniversary, _lisbon, nyc] = await db
    .insert(tripsTable)
    .values([
      {
        userId: user.id,
        name: "Kate's Hen Party",
        destination: 'Alicante, Spain',
        startDate: '2026-03-14',
        endDate: '2026-03-17',
        notes: 'Amazing weekend away for Kate before the big day!',
        country: 'Spain',
      },
      {
        userId: user.id,
        name: 'Girls Holiday',
        destination: 'Split, Croatia',
        startDate: '2026-02-06',
        endDate: '2026-02-12',
        notes: 'Remember to bring electrolytes',
        country: 'Croatia',
      },
      {
        userId: user.id,
        name: 'Staycation',
        destination: 'Durrus, Cork',
        startDate: '2026-01-10',
        endDate: '2026-01-12',
        notes: 'Cosy weekend break on the Sheep\'s Head Peninsula.',
        country: 'Ireland',
      },
      {
        userId: user.id,
        name: 'Anniversary Trip',
        destination: 'Killarney, Kerry',
        startDate: '2025-11-28',
        endDate: '2025-11-30',
        notes: 'A lovely few days in Kerry for our anniversary.',
        country: 'Ireland',
      },
      {
        userId: user.id,
        name: 'Summer in Lisbon',
        destination: 'Lisbon, Portugal',
        startDate: '2026-06-12',
        endDate: '2026-06-18',
        notes: 'Looking forward to exploring the city!',
        country: 'Portugal',
      },
      {
        userId: user.id,
        name: 'Christmas in New York',
        destination: 'New York City, USA',
        startDate: '2025-12-20',
        endDate: '2025-12-27',
        notes: 'A dream Christmas trip — lights, shows, and snow!',
        country: 'USA',
      },
    ])
    .returning();

  await db.insert(activitiesTable).values([

    // Kate's Hen Party — Alicante
    { tripId: hen.id, categoryId: nature.id,      name: 'Beach day at Playa del Postiguet', date: '2026-03-14', location: 'Playa del Postiguet', cost: null,   durationMins: 240, notes: 'Perfect weather, got a bit sunburned!' },
    { tripId: hen.id, categoryId: food.id,        name: 'Tapas tour of the old town',       date: '2026-03-14', location: 'Alicante Old Town',   cost: '€35',  durationMins: 150, notes: 'Patatas bravas were incredible' },
    { tripId: hen.id, categoryId: nightlife.id,   name: 'Cocktail masterclass',             date: '2026-03-15', location: 'Sky Bar Alicante',    cost: '€40',  durationMins: 120, notes: null },
    { tripId: hen.id, categoryId: sightseeing.id, name: 'Santa Bárbara Castle',             date: '2026-03-15', location: 'Castillo de Santa Bárbara', cost: '€3', durationMins: 90, notes: 'Amazing views over the city' },
    { tripId: hen.id, categoryId: nature.id,      name: 'Boat trip along the coast',        date: '2026-03-16', location: 'Alicante Marina',     cost: '€55',  durationMins: 180, notes: 'Swam in the clearest water' },
    { tripId: hen.id, categoryId: food.id,        name: 'Dinner at La Taberna del Gourmet', date: '2026-03-16', location: 'La Taberna, Alicante', cost: '€48', durationMins: 120, notes: null },
    { tripId: hen.id, categoryId: nightlife.id,   name: 'Club night out',                   date: '2026-03-16', location: 'El Barrio, Alicante',  cost: '€20',  durationMins: 240, notes: 'Best night of the trip!' },

    // Girls Holiday — Split
    { tripId: girls.id, categoryId: sightseeing.id, name: "Diocletian's Palace tour",     date: '2026-02-07', location: "Diocletian's Palace",  cost: '€15',  durationMins: 120, notes: 'Fascinating Roman history' },
    { tripId: girls.id, categoryId: food.id,        name: 'Seafood lunch at the harbour', date: '2026-02-07', location: 'Riva Promenade, Split', cost: '€30',  durationMins: 90,  notes: 'The grilled sea bass was divine' },
    { tripId: girls.id, categoryId: nature.id,      name: 'Day trip to Hvar island',      date: '2026-02-08', location: 'Hvar, Croatia',         cost: '€25',  durationMins: 480, notes: 'Worth every cent of the ferry' },
    { tripId: girls.id, categoryId: food.id,        name: 'Wine and olive oil tasting',   date: '2026-02-09', location: 'Dalmatian Winery, Split', cost: '€22', durationMins: 90,  notes: null },
    { tripId: girls.id, categoryId: shopping.id,    name: 'Old Town market browsing',     date: '2026-02-10', location: 'Split Green Market',    cost: '€60',  durationMins: 120, notes: 'Bought gorgeous local ceramics' },
    { tripId: girls.id, categoryId: nightlife.id,   name: 'Sunset cocktails at Zinfandel', date: '2026-02-10', location: 'Zinfandel\'s Bar',    cost: '€28',  durationMins: 90,  notes: null },
    { tripId: girls.id, categoryId: relaxation.id,  name: 'Spa morning',                  date: '2026-02-11', location: 'Hotel Vestibul Palace', cost: '€70',  durationMins: 150, notes: 'Absolute bliss' },

    // Staycation — Durrus
    { tripId: staycation.id, categoryId: nature.id,      name: "Sheep's Head Peninsula walk", date: '2026-01-10', location: "Sheep's Head Way",    cost: null,  durationMins: 210, notes: 'Stunning coastal views, very windy!' },
    { tripId: staycation.id, categoryId: food.id,        name: 'Stew and pints at Arundel\'s', date: '2026-01-10', location: "Arundel's Bar, Durrus", cost: '€22', durationMins: 90, notes: null },
    { tripId: staycation.id, categoryId: nature.id,      name: 'Kayaking on Dunmanus Bay',    date: '2026-01-11', location: 'Dunmanus Bay',          cost: '€30',  durationMins: 120, notes: 'Freezing but exhilarating' },
    { tripId: staycation.id, categoryId: sightseeing.id, name: 'Visit Bantry House & Gardens', date: '2026-01-11', location: 'Bantry House',          cost: '€12',  durationMins: 90,  notes: null },
    { tripId: staycation.id, categoryId: food.id,        name: 'Durrus Farmhouse cheese tasting', date: '2026-01-12', location: 'Durrus Farmhouse',  cost: '€10',  durationMins: 60,  notes: 'Best cheese I\'ve ever had' },

    // Anniversary Trip — Killarney
    { tripId: anniversary.id, categoryId: nature.id,      name: 'Gap of Dunloe hike',           date: '2025-11-28', location: 'Gap of Dunloe, Kerry',    cost: null,  durationMins: 300, notes: 'Breathtaking scenery' },
    { tripId: anniversary.id, categoryId: food.id,        name: 'Dinner at The Bricin',          date: '2025-11-28', location: 'The Bricin, Killarney',   cost: '€85',  durationMins: 120, notes: 'Best meal of the year' },
    { tripId: anniversary.id, categoryId: nature.id,      name: 'Killarney National Park cycle', date: '2025-11-29', location: 'Killarney National Park',  cost: '€16',  durationMins: 180, notes: null },
    { tripId: anniversary.id, categoryId: sightseeing.id, name: 'Ross Castle visit',             date: '2025-11-29', location: 'Ross Castle, Killarney',   cost: '€8',   durationMins: 75,  notes: null },
    { tripId: anniversary.id, categoryId: relaxation.id,  name: 'Afternoon tea at Muckross House', date: '2025-11-30', location: 'Muckross House',         cost: '€28',  durationMins: 90,  notes: 'Very fancy!' },
    { tripId: anniversary.id, categoryId: shopping.id,    name: 'Killarney craft shops',         date: '2025-11-30', location: 'Killarney Town Centre',    cost: '€45',  durationMins: 60,  notes: null },

    // Christmas in New York
    { tripId: nyc.id, categoryId: nature.id,      name: 'Central Park winter walk',           date: '2025-12-20', location: 'Central Park, NYC',          cost: null,  durationMins: 90,  notes: 'Snow on the ground, magical' },
    { tripId: nyc.id, categoryId: sightseeing.id, name: 'Times Square & Broadway district',   date: '2025-12-20', location: 'Times Square, NYC',           cost: null,  durationMins: 60,  notes: null },
    { tripId: nyc.id, categoryId: sightseeing.id, name: 'Broadway — Wicked',                  date: '2025-12-21', location: 'Gershwin Theatre, NYC',       cost: '€120', durationMins: 165, notes: 'Absolutely spectacular' },
    { tripId: nyc.id, categoryId: shopping.id,    name: 'Christmas markets & 5th Avenue',     date: '2025-12-21', location: '5th Avenue, NYC',             cost: '€200', durationMins: 150, notes: null },
    { tripId: nyc.id, categoryId: sightseeing.id, name: 'Metropolitan Museum of Art',         date: '2025-12-22', location: 'The Met, NYC',                cost: '€30',  durationMins: 180, notes: 'Could have spent days here' },
    { tripId: nyc.id, categoryId: food.id,        name: 'Dinner at Carbone',                  date: '2025-12-22', location: 'Carbone, Greenwich Village',  cost: '€160', durationMins: 120, notes: 'Worth the hype, absolutely worth it' },
    { tripId: nyc.id, categoryId: nature.id,      name: 'Ice skating at Rockefeller Center',  date: '2025-12-23', location: 'Rockefeller Center, NYC',     cost: '€35',  durationMins: 90,  notes: null },
    { tripId: nyc.id, categoryId: sightseeing.id, name: 'Brooklyn Bridge walk',               date: '2025-12-24', location: 'Brooklyn Bridge, NYC',        cost: null,   durationMins: 60,  notes: null },
    { tripId: nyc.id, categoryId: food.id,        name: 'Christmas Eve dinner at Gramercy Tavern', date: '2025-12-24', location: 'Gramercy Tavern, NYC', cost: '€140', durationMins: 150, notes: 'Perfect Christmas Eve' },
    { tripId: nyc.id, categoryId: shopping.id,    name: "Macy's and SoHo shopping",           date: '2025-12-26', location: "Macy's Herald Square, NYC",  cost: '€180', durationMins: 180, notes: 'Boxing Day sales were insane' },
  ]);

  await db.insert(targetsTable).values([
    {
      userId: user.id,
      type: 'activity',
      label: 'Try 2 local restaurants in NYC',
      tripId: nyc.id,
      categoryId: food.id,
      period: null,
      targetValue: 2,
    },
    {
      userId: user.id,
      type: 'activity',
      label: 'Visit a sight in Alicante',
      tripId: hen.id,
      categoryId: sightseeing.id,
      period: null,
      targetValue: 1,
    },
    {
      userId: user.id,
      type: 'spending',
      label: 'Keep spending under €500 this month',
      tripId: null,
      categoryId: null,
      period: 'monthly',
      targetValue: 500,
    },
    {
      userId: user.id,
      type: 'trips_count',
      label: 'Take 2 trips this quarter',
      tripId: null,
      categoryId: null,
      period: 'quarterly',
      targetValue: 2,
    },
  ]);
}
