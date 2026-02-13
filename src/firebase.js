import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYcpHS4veok-QD3l4mqkNb3R9613ZhLV4",
  authDomain: "my-kanban-e7698.firebaseapp.com",
  projectId: "my-kanban-e7698",
  storageBucket: "my-kanban-e7698.firebasestorage.app",
  messagingSenderId: "797504794988",
  appId: "1:797504794988:web:ccce9089f38f8e5eabc349",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
