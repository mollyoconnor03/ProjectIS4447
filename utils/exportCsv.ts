import { Activity, Category, Trip } from '@/app/_layout';

function csvVal(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function row(...cells: (string | number | null | undefined)[]): string {
  return cells.map(csvVal).join(',');
}

function parseCost(val: string | null): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

export function buildTripCsv(trip: Trip, activities: Activity[], categories: Category[]): string {
  const totalActivityCost = activities.reduce((sum, a) => sum + parseCost(a.cost), 0);

  const lines: string[] = [
    'TRIP SUMMARY',
    row('Name', trip.name),
    row('Destination', trip.destination),
    row('Country', trip.country),
    row('Start date', trip.startDate),
    row('End date', trip.endDate),
    row('Accommodation', trip.accommodationName),
    row('Accommodation cost', trip.accommodationCost),
    row('Total activities', activities.length),
    row('Total activity cost', `€${totalActivityCost.toFixed(2)}`),

    '',

    'ACTIVITIES',
    row('Title', 'Date', 'Category', 'Cost', 'Notes'),
    ...activities.map(a => {
      const cat = categories.find(c => c.id === a.categoryId);
      return row(a.name, a.date, cat?.name ?? '', a.cost, a.notes);
    }),
  ];

  return lines.join('\n');
}
