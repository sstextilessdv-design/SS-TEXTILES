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
  apiKey: "PASTE_YOUR_FIREBASE_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID",
  appId: "PASTE_YOUR_FIREBASE_APP_ID"
};

window.STORE_ACCESS = {
  // Put your Google account email here. Example:
  // ADMIN_EMAILS: ["sstextilessdv@gmail.com"]
  ADMIN_EMAILS: ["sstextilessdv@gmail.com"]
};
