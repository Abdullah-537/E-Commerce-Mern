import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBVvVJcLku1rMWhYtfoBeUO2D7uULZEUkk",
  authDomain: "ecommerce-7e6b0.firebaseapp.com",
  projectId: "ecommerce-7e6b0",
  storageBucket: "ecommerce-7e6b0.firebasestorage.app",
  messagingSenderId: "70173252237",
  appId: "1:70173252237:web:47b92d2e2b7d30b6fa60c4",
  measurementId: "G-2E2PCTQ37C"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
