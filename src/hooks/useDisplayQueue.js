import { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export function useDisplayQueue(classId) {
  const [queue, setQueue] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const initialLoadDone = useRef(false);
  const processedIds = useRef(new Set());

  // Listen for new star events
  useEffect(() => {
    if (!classId) return;

    const q = query(
      collection(db, 'starEvents'),
      where('classId', '==', classId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!initialLoadDone.current) {
        // First load: just mark all existing events as processed
        snapshot.docs.forEach(doc => processedIds.current.add(doc.id));
        initialLoadDone.current = true;
        return;
      }

      // Subsequent loads: find new active events
      const newEvents = [];
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.status === 'active' && !processedIds.current.has(change.doc.id)) {
            processedIds.current.add(change.doc.id);
            newEvents.push({ id: change.doc.id, ...data });
          }
        }
      });

      if (newEvents.length > 0) {
        // Sort by creation time to ensure correct order
        newEvents.sort((a, b) => {
           const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
           const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
           return timeA - timeB; // Oldest first in queue
        });
        
        setQueue(prev => [...prev, ...newEvents]);
      }
    });

    return () => unsubscribe();
  }, [classId]);

  // Process the queue
  const processNext = () => {
    if (queue.length === 0) {
      setCurrentEvent(null);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    const nextEvent = queue[0];
    setCurrentEvent(nextEvent);
    setQueue(prev => prev.slice(1));
  };

  const finishCurrentEvent = () => {
    setCurrentEvent(null);
    setIsProcessing(false);
  };

  return {
    queue,
    currentEvent,
    isProcessing,
    processNext,
    finishCurrentEvent,
    queueLength: queue.length
  };
}
