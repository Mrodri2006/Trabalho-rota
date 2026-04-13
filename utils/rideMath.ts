import { Ride } from '../storage/rideStorage';

export function gainPerKm(ride: Ride): number {
  return ride.distanceKm > 0 ? ride.gross / ride.distanceKm : 0;
}

export function netProfit(ride: Ride): number {
  return ride.gross - ride.costs;
}

export function sumGross(rides: Ride[]): number {
  return rides.reduce((total, ride) => total + ride.gross, 0);
}

export function sumCosts(rides: Ride[]): number {
  return rides.reduce((total, ride) => total + ride.costs, 0);
}

export function sumNet(rides: Ride[]): number {
  return rides.reduce((total, ride) => total + netProfit(ride), 0);
}

export function averageGainPerKm(rides: Ride[]): number {
  const totalKm = rides.reduce((total, ride) => total + ride.distanceKm, 0);
  const totalGross = sumGross(rides);
  return totalKm > 0 ? totalGross / totalKm : 0;
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatShortDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}
