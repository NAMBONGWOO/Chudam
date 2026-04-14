const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDXH8MZQshUdhFVCqx3C4Q2iCjY5H_Omxg",
  authDomain: "chudam-b36f1.firebaseapp.com",
  projectId: "chudam-b36f1",
  storageBucket: "chudam-b36f1.firebasestorage.app",
  messagingSenderId: "958665340328",
  appId: "1:958665340328:web:d6bb2b602385c6e801999d",
  measurementId: "G-G5C8Z96DFP"
};

firebase.initializeApp(FIREBASE_CONFIG);

const auth = firebase.auth();
const db = firebase.firestore();

console.log("\ud83c\udf32 \ucd94\ub2f4\uacf5\uc6d0 Firebase \ucd08\uae30\ud654 \uc644\ub8cc");
