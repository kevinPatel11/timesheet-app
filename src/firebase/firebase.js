// timesheet-app/src/firebase/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
    apiKey: "AIzaSyBYgzENiDeG1jSOYgwYz-m-rWvUIg9yw6E",
    authDomain: "timesheet-app-fe9b8.firebaseapp.com",
    projectId: "timesheet-app-fe9b8",
    storageBucket: "timesheet-app-fe9b8.firebasestorage.app",
    messagingSenderId: "187700563640",
    appId: "1:187700563640:web:ed5562a77a1bf071e6ae4d",
    measurementId: "G-YWS6LDF3TK"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
