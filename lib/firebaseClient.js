// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDSL7s6jHkUdLParDZMItjHNSrtFECvg3A',
  authDomain: 'livik-tech-tool-dev.firebaseapp.com',
  projectId: 'livik-tech-tool-dev',
  storageBucket: 'livik-tech-tool-dev.firebasestorage.app',
  messagingSenderId: '353538485069',
  appId: '1:353538485069:web:985604340d8566d0862504',
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
auth.useDeviceLanguage();

export { auth };
