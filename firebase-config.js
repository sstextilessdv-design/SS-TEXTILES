// SS Textiles Gifts - Firebase configuration
// 1. Create a Firebase project.
// 2. Add a Web App.
// 3. Copy the Firebase config from Project settings -> Your apps.
// 4. Replace the values below.
// 5. Set ADMIN_EMAILS to the Google account(s) that should manage products.
//
// IMPORTANT: This file contains only Firebase's browser-safe Web App config.
// Firestore/Storage Rules provide the real security.

window.FIREBASE_CONFIG = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

window.STORE_ACCESS = {
  ADMIN_EMAILS: ["YOUR_ADMIN_GMAIL@gmail.com"]
};
