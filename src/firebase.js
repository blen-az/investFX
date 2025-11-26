// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTdhyBMYdpOy3a7SDYHyXmFJPgD5Ao7nA",
  authDomain: "investfx-1faf1.firebaseapp.com",
  projectId: "investfx-1faf1",
  storageBucket: "investfx-1faf1.firebasestorage.app",
  messagingSenderId: "310036681524",
  appId: "1:310036681524:web:7937a954a237d15c030b61"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
