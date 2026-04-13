import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserProfile = {
  name: string;
  email: string;
};

const PROFILE_KEY = 'driverProfile:v1';

function keyFor(userId: string): string {
  return `${PROFILE_KEY}:${userId}`;
}

export async function loadProfile(userId: string): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(keyFor(userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function saveProfile(userId: string, profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(profile));
}

export async function clearProfile(userId: string): Promise<void> {
  await AsyncStorage.removeItem(keyFor(userId));
}
