import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
});

export const targetsTable = sqliteTable('targets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id'),
  tripId: integer('trip_id'),
  categoryId: integer('category_id'),
  label: text('label').notNull(),
  period: text('period').notNull(),
  targetValue: integer('target_value').notNull(),
});