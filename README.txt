SS TEXTILES GIFTS — Firebase Google Sign-In Edition

This website is configured so:
- Public customers can view products.
- Google Sign-In is available.
- Only the configured admin Google account can see Product Manager.
- Only that admin can Add / Edit / Delete products.
- Firestore Rules and Storage Rules enforce the same restriction.

Read FIREBASE_SETUP.txt before publishing.

Files:
- index.html
- script.js
- style.css
- firebase-config.js       <-- add your Firebase config + admin email
- firestore.rules          <-- secure Firestore product access
- storage.rules             <-- secure product image access
- FIREBASE_SETUP.txt        <-- step-by-step Firebase setup
- logo.png
