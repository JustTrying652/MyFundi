import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCOFuzplF7cVqR27homB068v1uPeCZgbTE",
  authDomain: "myfundi-18af3.firebaseapp.com",
  projectId: "myfundi-18af3",
  storageBucket: "myfundi-18af3.firebasestorage.app",
  messagingSenderId: "896209092032",
  appId: "1:896209092032:web:e29c0298b7f8164ebbdc25"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);