import { Ride } from '../storage/rideStorage';
import { formatDateKey } from './rideMath';

export type Period = 'day' | 'week' | 'month';

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function filterByPeriod(rides: Ride[], period: Period, now = new Date()): Ride[] {
  if (period === 'day') {
    return rides.filter((ride) => isSameDay(new Date(ride.dateISO), now));
  }

  if (period === 'week') {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return rides.filter((ride) => new Date(ride.dateISO) >= start);
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return rides.filter((ride) => new Date(ride.dateISO) >= start);
}

export function buildDailySeries(rides: Ride[], period: Period, now = new Date()): {
  labels: string[];
  values: number[];
  keys: string[];
} {
  const days: Date[] = [];
  if (period === 'day') {
    days.push(new Date(now));
  } else if (period === 'week') {
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      days.push(day);
    }
  } else {
    const totalDays = 30;
    for (let i = totalDays - 1; i >= 0; i -= 1) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      days.push(day);
    }
  }

  const map = new Map<string, number>();
  rides.forEach((ride) => {
    const key = formatDateKey(new Date(ride.dateISO));
    const current = map.get(key) ?? 0;
    map.set(key, current + (ride.gross - ride.costs));
  });

  return {
    labels: days.map((day) => `${day.getDate()}/${day.getMonth() + 1}`),
    values: days.map((day) => map.get(formatDateKey(day)) ?? 0),
    keys: days.map((day) => formatDateKey(day)),
  };
}
