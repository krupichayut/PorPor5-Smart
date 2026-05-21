import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDS6W0aZv03BYGzED0CEXDopof2BhFEkFE",
  authDomain: "porpor5-smart-b96bc.firebaseapp.com",
  projectId: "porpor5-smart-b96bc",
  storageBucket: "porpor5-smart-b96bc.firebasestorage.app",
  messagingSenderId: "982820702781",
  appId: "1:982820702781:web:c10b01668587e40d517854"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
