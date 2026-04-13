import { firestore, auth } from '../firebase';
import { Ride } from '../storage/rideStorage';

export async function backupRides(rides: Ride[], userId?: string): Promise<void> {
  const user = userId ? { uid: userId } : auth.currentUser;
  if (!user) {
    throw new Error('Usuario nao autenticado. Faca login para usar o backup.');
  }

  const userRef = firestore.collection('drivers').doc(user.uid);
  const batch = firestore.batch();

  batch.set(
    userRef,
    {
      updatedAt: new Date(),
      totalRides: rides.length,
    },
    { merge: true }
  );

  rides.forEach((ride) => {
    const rideRef = userRef.collection('rides').doc(ride.id);
    batch.set(rideRef, ride, { merge: true });
  });

  await batch.commit();
}

export async function fetchRidesFromCloud(userId: string): Promise<Ride[]> {
  const snapshot = await firestore
    .collection('drivers')
    .doc(userId)
    .collection('rides')
    .get();

  return snapshot.docs.map((doc) => doc.data() as Ride);
}

export function mergeRides(localRides: Ride[], cloudRides: Ride[]): Ride[] {
  const map = new Map<string, Ride>();
  localRides.forEach((ride) => map.set(ride.id, ride));
  cloudRides.forEach((ride) => map.set(ride.id, ride));

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
  );
}

export async function deleteAllRidesFromCloud(userId: string): Promise<void> {
  const ridesRef = firestore.collection('drivers').doc(userId).collection('rides');
  const snapshot = await ridesRef.get();
  if (snapshot.empty) return;

  const docs = snapshot.docs;
  const chunkSize = 400;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const batch = firestore.batch();
    docs.slice(i, i + chunkSize).forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
}
