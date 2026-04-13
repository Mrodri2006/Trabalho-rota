import AsyncStorage from '@react-native-async-storage/async-storage';

export type Ride = {
  id: string;
  distanceKm: number;
  gross: number;
  costs: number;
  dateISO: string;
};

const RIDES_KEY = 'rides:v1';

function keyFor(userId: string): string {
  return `${RIDES_KEY}:${userId}`;
}

async function migrateLegacyRides(userId: string): Promise<Ride[]> {
  const legacyRaw = await AsyncStorage.getItem(RIDES_KEY);
  if (!legacyRaw) return [];

  try {
    const parsed = JSON.parse(legacyRaw) as Ride[];
    const rides = Array.isArray(parsed) ? parsed : [];
    if (rides.length > 0) {
      await AsyncStorage.setItem(keyFor(userId), JSON.stringify(rides));
    }
    return rides;
  } catch {
    return [];
  }
}

export async function loadRides(userId: string): Promise<Ride[]> {
  const raw = await AsyncStorage.getItem(keyFor(userId));
  if (!raw) {
    return migrateLegacyRides(userId);
  }
  try {
    const parsed = JSON.parse(raw) as Ride[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveRides(userId: string, rides: Ride[]): Promise<void> {
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(rides));
}

export async function addRide(userId: string, ride: Ride): Promise<Ride[]> {
  const rides = await loadRides(userId);
  const next = [ride, ...rides].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
  );
  await saveRides(userId, next);
  return next;
}

export async function clearRides(userId: string): Promise<void> {
  await AsyncStorage.removeItem(keyFor(userId));
}
