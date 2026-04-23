import { db } from '@/db/client';
import { activitiesTable, targetsTable } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export type StreakResult = {
  count: number;
  message: string;
};

export async function calculateStreak(userId: number, allTrips: { id: number; userId: number | null; endDate: string }[]): Promise<StreakResult> {
  const today = new Date().toISOString().slice(0, 10);

  const pastTrips = allTrips
    .filter(t => t.userId === userId && t.endDate < today)
    .sort((a, b) => b.endDate.localeCompare(a.endDate));

  if (pastTrips.length === 0) {
    return { count: 0, message: 'Complete a trip and hit your targets to start a streak.' };
  }

  const allTargets = await db.select().from(targetsTable).where(eq(targetsTable.userId, userId));
  const tripTargets = allTargets.filter(t => t.type === 'activity');

  const anyTripHasTargets = pastTrips.some(trip => tripTargets.some(t => t.tripId === trip.id));
  if (!anyTripHasTargets) {
    return { count: 0, message: 'Set targets on your next trip to start tracking your streak.' };
  }

  const pastTripIds = pastTrips.map(t => t.id);
  const activities = await db.select().from(activitiesTable).where(inArray(activitiesTable.tripId, pastTripIds));

  let streak = 0;
  for (const trip of pastTrips) {
    const targets = tripTargets.filter(t => t.tripId === trip.id);

    if (targets.length === 0) continue; // trips with no targets don't break the streak

    const allMet = targets.every(target => {
      const count = activities.filter(a => {
        if (a.tripId !== target.tripId) return false;
        if (target.categoryId !== null && a.categoryId !== target.categoryId) return false;
        return true;
      }).length;
      return count >= target.targetValue;
    });

    if (allMet) {
      streak++;
    } else {
      break;
    }
  }

  if (streak === 0) {
    return { count: 0, message: 'Complete a trip and hit your targets to start a streak.' };
  }
  if (streak === 1) {
    return { count: 1, message: 'You hit your targets on your last trip. Keep it up.' };
  }
  return { count: streak, message: `You've hit your targets on your last ${streak} trips.` };
}
