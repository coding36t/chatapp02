import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import { getDatabase } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAmjj7zA6YhnH44iwPKhZFR66g4gUPyiSQ",
    authDomain: "chat-application-f05f8.firebaseapp.com",
    databaseURL: "https://chat-application-f05f8-default-rtdb.firebaseio.com",
    projectId: "chat-application-f05f8",
    storageBucket: "chat-application-f05f8.firebasestorage.app",
    messagingSenderId: "328713497323",
    appId: "1:328713497323:web:38c0bfe08c1301a1d26cae"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
