import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export function useRewards(classId) {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    
    // In a real app, you might want global rewards (classId == null) + class specific.
    // For simplicity, we assume rewards are class-specific.
    const q = query(
      collection(db, 'rewards'),
      where('classId', '==', classId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRewards(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [classId]);

  return { rewards, loading };
}

export function useRedemptions(classId) {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    
    const q = query(
      collection(db, 'redemptions'),
      where('classId', '==', classId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory
      docs.sort((a, b) => {
        const timeA = a.requestedAt?.toMillis ? a.requestedAt.toMillis() : Date.now();
        const timeB = b.requestedAt?.toMillis ? b.requestedAt.toMillis() : Date.now();
        return timeB - timeA; // newest first
      });
      setRedemptions(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [classId]);

  return { redemptions, loading };
}
