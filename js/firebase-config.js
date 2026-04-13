// ── Firebase Configuration ──────────────────────
// TODO: 아래 값을 Firebase Console에서 복사한 실제 값으로 교체하세요
// Firebase Console → 프로젝트 설정 → 내 앱 → SDK 설정 및 구성

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

// Firestore 설정
db.settings({ 
  experimentalForceLongPolling: true  // 일부 네트워크 환경 호환성
});

console.log("🌲 추담공원 Firebase 초기화 완료");
