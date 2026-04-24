import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 1. Added this import

const firebaseConfig = {
  apiKey: "AIzaSyDRnFWeL_RMJFFUFwZz9neZl_6ipzUnoRU",
  authDomain: "facebook-clone-ray.firebaseapp.com",
  projectId: "facebook-clone-ray",
  storageBucket: "facebook-clone-ray.firebasestorage.app",
  messagingSenderId: "1032920453190",
  appId: "1:1032920453190:web:f36c05e9b4632313ca7a47",
  measurementId: "G-N1NJP96B6N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the tools
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // 2. Added this export
export const googleProvider = new GoogleAuthProvider();

