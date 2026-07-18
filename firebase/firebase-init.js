// ============================================
// Firebase Initialization - BTH v3.0
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDocs, 
    getDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    limit,
    Timestamp,
    writeBatch,
    onSnapshot,
    setDoc,
    getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ============================================
// Firebase Configuration
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyBb5pGaMu-ECckJdD4VkQ6uGbu3pF5lwI0",
    authDomain: "bidiya-training-hub.firebaseapp.com",
    databaseURL: "https://bidiya-training-hub-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bidiya-training-hub",
    storageBucket: "bidiya-training-hub.firebasestorage.app",
    messagingSenderId: "764998117310",
    appId: "1:764998117310:web:bf3fecefc0ef312300bbef",
    measurementId: "G-QTBPS4J3QR"
};

// ============================================
// Initialize Firebase
// ============================================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firebase initialized successfully');

// ============================================
// Collections
// ============================================
export const WORKSHOPS_COLLECTION = 'workshops';
export const EMPLOYEES_COLLECTION = 'employees';

// ============================================
// Export
// ============================================
export {
    db,
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    writeBatch,
    onSnapshot,
    setDoc,
    getCountFromServer
};
