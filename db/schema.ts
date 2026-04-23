import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
});

export const tripsTable = sqliteTable('trips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id'),
  name: text('name').notNull(),
  destination: text('destination').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  notes: text('notes'),
  accommodationName: text('accommodation_name'),
  accommodationCost: text('accommodation_cost'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  country: text('country'),
  reflectMemory: text('reflect_memory'),
  reflectMeal: text('reflect_meal'),
  reflectSpot: text('reflect_spot'),
  reflectNotes: text('reflect_notes'),
});

export const categoriesTable = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#2D6A8F'),
  icon: text('icon').notNull().default('compass'),
  userId: integer('user_id'),
});

export const activitiesTable = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').notNull(),
  categoryId: integer('category_id'),
  name: text('name').notNull(),
  date: text('date').notNull(),
  startTime: text('start_time'),
  location: text('location'),
  cost: text('cost'),
  participants: text('participants'),
  notes: text('notes'),
  durationMins: integer('duration_mins'),
});

export const transportTable = sqliteTable('transport', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').notNull(),
  type: text('type').notNull().default('other'), // 'flight'|'bus'|'train'|'ferry'|'other'
  description: text('description').notNull(),
  date: text('date').notNull(),
  cost: text('cost'),
  notes: text('notes'),
});

export const accommodationsTable = sqliteTable('accommodations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tripId: integer('trip_id').notNull(),
  name: text('name').notNull(),
  checkIn: text('check_in').notNull(),
  checkOut: text('check_out').notNull(),
  cost: text('cost'),
  notes: text('notes'),
});

export const targetsTable = sqliteTable('targets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id'),
  type: text('type').notNull().default('activity'), // 'activity' | 'trips_count' | 'spending'
  label: text('label').notNull(),
  tripId: integer('trip_id'),       // activity targets only
  categoryId: integer('category_id'), // activity targets only
  period: text('period'),            // period goals only: 'monthly' | 'quarterly'
  targetValue: real('target_value').notNull(),
});