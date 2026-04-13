import { useCallback, useEffect, useState } from 'react';
import { addRide, loadRides, saveRides, Ride } from '../storage/rideStorage';
import { auth } from '../firebase';
import { fetchRidesFromCloud, mergeRides } from '../services/backup';

const GUEST_ID = 'guest';

export function useRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(auth.currentUser?.uid ?? GUEST_ID);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user?.uid ?? GUEST_ID);
    });
    return unsubscribe;
  }, []);

  const refresh = useCallback(async () => {
    const stored = await loadRides(userId);
    setRides(stored);
    setLoading(false);

    if (userId !== GUEST_ID) {
      try {
        const cloudRides = await fetchRidesFromCloud(userId);
        const merged = mergeRides(stored, cloudRides);
        if (merged.length !== stored.length) {
          await saveRides(userId, merged);
          setRides(merged);
        }
      } catch {
        // Sem permissoes ou sem rede, fica com o local.
      }
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createRide = useCallback(
    async (ride: Ride) => {
      const next = await addRide(userId, ride);
      setRides(next);
      return next;
    },
    [userId]
  );

  const replaceRides = useCallback(
    async (next: Ride[]) => {
      await saveRides(userId, next);
      setRides(next);
    },
    [userId]
  );

  return { rides, loading, refresh, createRide, replaceRides, userId };
}
