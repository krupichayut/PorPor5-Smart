import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestoreData(collectionName, documentId, initialValue) {
  const [data, setData] = useState(initialValue);
  const [initialized, setInitialized] = useState(false);
  const initialValueRef = useRef(initialValue);

  useEffect(() => {
    const docRef = doc(db, collectionName, documentId);
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const docData = docSnap.data().value;
        setData(docData !== undefined ? docData : initialValueRef.current);
      } else {
        // Document doesn't exist yet, we will initialize it on the first set()
        // But for local state, we can keep initialValue
        setData(initialValueRef.current);
      }
      setInitialized(true);
    }, (error) => {
      console.error("Error fetching Firestore data:", error);
      // Fallback to initial value if there is a permission error or network issue
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [collectionName, documentId]);

  const setValue = useCallback((newValue) => {
    const valueToStore = newValue instanceof Function ? newValue(data) : newValue;
    setData(valueToStore);
    
    // Save to Firestore
    const docRef = doc(db, collectionName, documentId);
    setDoc(docRef, { value: valueToStore }, { merge: true })
      .catch(error => {
        console.error("Error saving to Firestore:", error);
      });
      
  }, [collectionName, documentId, data]);

  return [data, setValue, initialized];
}
