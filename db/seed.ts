import { db } from './client';
import { activitiesTable, categoriesTable, tripsTable } from './schema';

export async function seedTripsIfEmpty() {
  const existing = await db.select().from(tripsTable);
  if (existing.length > 0) return;

  await db.insert(tripsTable).values([
    { name: 'Paris Weekend', destination: 'Paris, France', startDate: '2025-06-14', endDate: '2025-06-16' },
    { name: 'Tokyo Adventure', destination: 'Tokyo, Japan', startDate: '2025-09-01', endDate: '2025-09-10' },
  ]);

  await db.insert(categoriesTable).values([
    { name: 'Sightseeing', color: '#2D6A8F', icon: 'compass', userId: null },
    { name: 'Outdoor', color: '#2D7A4F', icon: 'bicycle', userId: null },
    { name: 'Food & Drink', color: '#7A5C2D', icon: 'restaurant', userId: null },
  ]);

  await db.insert(activitiesTable).values([
    { tripId: 1, categoryId: 1, name: 'Eiffel Tower Visit', date: '2025-06-14', startTime: '10:00 AM', location: 'Eiffel Tower', cost: '€26', participants: null, notes: 'Book tickets in advance' },
    { tripId: 1, categoryId: 3, name: 'Dinner at Le Marais', date: '2025-06-14', startTime: '7:30 PM', location: 'Le Marais, Paris', cost: null, participants: null, notes: null },
    { tripId: 2, categoryId: 2, name: 'Hike Mount Takao', date: '2025-09-03', startTime: '9:00 AM', location: 'Mount Takao, Tokyo', cost: null, participants: null, notes: null },
  ]);
}