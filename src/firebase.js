import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDVcphS4veok-OD3l4mqkNh3R9A+37hLV4",
  authDomain: "my-kanban-e7698.firebaseapp.com",
  projectId: "my-kanban-e7698",
  storageBucket: "my-kanban-e7698.firebasestorage.app",
  messagingSenderId: "797504794988",
  appId: "1:797504794988:web:ccce9889f38f8e5e8bc349"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
