# OrderDesk

A responsive single-page restaurant and hotel ordering dashboard built with HTML, CSS, JavaScript, Firebase Authentication, and Firebase Firestore.

## Files

- `index.html` — main application UI
- `styles.css` — responsive styling
- `script.js` — Firebase auth, Firestore, and application logic
- `firebase.rules` — Firestore security rules for hotel-specific access

## Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Email/Password Authentication under Authentication > Sign-in method
3. Create a Firestore database in production or test mode
4. Replace the placeholder values in `script.js` with your Firebase config:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

5. Deploy the security rules in Firestore using `firebase.rules` or the Firebase console.

## Run Locally

Open `index.html` in a browser or use a local server such as Live Server in VS Code.

## Features

- Hotel registration and login
- Menu management (add, edit, delete items)
- Table order creation with quantity control
- Automatic bill calculation
- Daily sales report and order history
- Hotel-specific Firestore data separation
