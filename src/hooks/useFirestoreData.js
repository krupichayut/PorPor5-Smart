import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestoreData(collectionName, documentId, initialValue) {
  const [data, setData] = useState(initialValue);
  const [initialized, setInitialized] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const initialValueRef = useRef(initialValue);
  const dataRef = useRef(initialValue);
  const writeQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    const docRef = doc(db, collectionName, documentId);
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      let nextData = initialValueRef.current;
      if (docSnap.exists()) {
        const docData = docSnap.data().value;
        nextData = docData !== undefined ? docData : initialValueRef.current;
      }
      dataRef.current = nextData;
      setData(nextData);
      setInitialized(true);
    }, (error) => {
      console.error("Error fetching Firestore data:", error);
      // Fallback to initial value if there is a permission error or network issue
      setInitialized(true);
    });

    return () => unsubscribe();
  }, [collectionName, documentId]);

  const setValue = useCallback((newValue) => {
    const valueToStore = newValue instanceof Function ? newValue(dataRef.current) : newValue;
    dataRef.current = valueToStore;
    setData(valueToStore);
    setSaveError(null);
    
    const docRef = doc(db, collectionName, documentId);
    writeQueueRef.current = writeQueueRef.current
      .catch(() => {})
      .then(() => setDoc(docRef, { value: valueToStore }, { merge: true }))
      .catch(error => {
        console.error("Error saving to Firestore:", error);
        setSaveError(error);
      });
       
  }, [collectionName, documentId]);

  return [data, setValue, initialized, saveError];
}
