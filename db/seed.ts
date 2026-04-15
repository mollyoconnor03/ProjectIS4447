import { db } from './client';
import { studentsTable } from './schema';
export async function seedStudentsIfEmpty() {
const existing = await db.select().from(studentsTable);
if (existing.length > 0) return;
await db.insert(studentsTable).values([
{ name: 'Emilia', major: 'Computer Science', year: '3', count: 0 },
{ name: 'Jackie', major: 'Business', year: '2', count: 0 },
{ name: 'Sammy', major: 'Engineering', year: '4', count: 0 },
]);
}