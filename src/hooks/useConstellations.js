import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export function useConstellations(classId) {
  const [starEvents, setStarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!classId) {
      setStarEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Subscribe to all star events for this class
    const q = query(
      collection(db, 'starEvents'),
      where('classId', '==', classId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort in memory to avoid needing a composite index in Firestore
      events.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      setStarEvents(events);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching star events:", err);
      // Wait, orderBy requires an index if combined with equality.
      // Actually, where('classId', '==', classId) + orderBy('createdAt') requires a composite index in Firestore!
      // If we don't have the index, this will fail. Let's just fetch all and sort in client to be safe without index.
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [classId]);

  return { starEvents, loading, error };
}

// Utility to calculate constellation data for a specific student
export function calculateStudentConstellations(starEvents, studentId, starsPerConstellation = 5, redemptions = []) {
  // 1. Get active stars
  const studentStars = starEvents.filter(e => e.studentId === studentId && e.status === 'active');
  const activeStars = studentStars.length; // Assuming each event amount = 1

  // 2. Lifetime constellations
  const lifetimeConstellations = Math.floor(activeStars / starsPerConstellation);
  
  // 3. Partial stars (currently building)
  const partialStars = activeStars % starsPerConstellation;

  // 4. Spent constellations
  const spentConstellations = redemptions
    .filter(r => r.studentId === studentId && ['approved', 'waiting', 'received'].includes(r.status))
    .reduce((sum, r) => sum + (r.constellationCost || 0), 0);

  // 5. Available constellations
  const availableConstellations = Math.max(0, lifetimeConstellations - spentConstellations);

  return {
    activeStars,
    lifetimeConstellations,
    partialStars,
    spentConstellations,
    availableConstellations,
    history: studentStars
  };
}
