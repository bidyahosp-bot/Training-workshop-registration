// ============================================
// Firebase Initialization - BTH
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
    setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAnalytics 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

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
const analytics = getAnalytics(app);

// ============================================
// Collections
// ============================================
const WORKSHOPS_COLLECTION = 'workshops';
const EMPLOYEES_COLLECTION = 'employees';
const SYNC_STATUS_COLLECTION = 'syncStatus';

// ============================================
// Export
// ============================================
export {
    app,
    db,
    analytics,
    WORKSHOPS_COLLECTION,
    EMPLOYEES_COLLECTION,
    SYNC_STATUS_COLLECTION,
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
    setDoc
};