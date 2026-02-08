// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC4_w2vtyhQtO07t9T5uVCoXd7qThZ7UV8",
    authDomain: "connectgrower-b5211.firebaseapp.com",
    projectId: "connectgrower-b5211",
    storageBucket: "connectgrower-b5211.firebasestorage.app",
    messagingSenderId: "1013076222267",
    appId: "1:1013076222267:web:dd9f28a0bc3c8c0093171e",
    measurementId: "G-GMLEQSHJFV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
export const db = getFirestore(app); // Export db
