import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBrpfYiAJ5s1__KTzJfCQEnEvrj7GrXP44",
  authDomain: "dineflow-pro-a6aa0.firebaseapp.com",
  projectId: "dineflow-pro-a6aa0",
  storageBucket: "dineflow-pro-a6aa0.firebasestorage.app",
  messagingSenderId: "584031502179",
  appId: "1:584031502179:web:be0419aaa4329bf58d5d56",
  measurementId: "G-SB6ZWW9YYD"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
