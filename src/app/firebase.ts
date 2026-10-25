import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAh_2OUCY_0nQy5HjSp_04D0eSdCdrMWLA",
  authDomain: "pawan-s-chinese.firebaseapp.com",
  databaseURL: "https://pawan-s-chinese-default-rtdb.firebaseio.com",
  projectId: "pawan-s-chinese",
  storageBucket: "pawan-s-chinese.firebasestorage.app",
  messagingSenderId: "505839357272",
  appId: "1:505839357272:web:4f0b9a7ba8a4591619292d",
  measurementId: "G-V6NSMNBT52"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
