# 추담공원 앱 — 개발 설정 가이드

## 📁 파일 구조
```
choodam/
├── index.html          ← 앱 진입점
├── manifest.json       ← PWA 설정
├── sw.js               ← 서비스워커 (오프라인 지원)
├── firestore.rules     ← Firestore 보안 규칙
├── css/
│   └── style.css       ← 전체 디자인 시스템
├── js/
│   ├── firebase-config.js  ← Firebase 연결 설정
│   ├── auth.js             ← 로그인/회원가입
│   ├── db.js               ← Firestore 데이터 처리
│   ├── matching.js         ← 가문 연결 매칭 엔진
│   ├── tree.js             ← 가계도 SVG 렌더러
│   └── app.js              ← 앱 전체 화면 제어
└── icons/
    ├── icon-192.png    ← PWA 아이콘 (직접 제작 필요)
    └── icon-512.png    ← PWA 아이콘 (직접 제작 필요)
```

## 🚀 배포 순서

### 1단계: Firebase 프로젝트 생성
1. https://console.firebase.google.com 접속
2. "프로젝트 추가" → 이름: `choodam-park`
3. Google Analytics: 선택 사항 (권장: 활성화)

### 2단계: Firebase 서비스 활성화
- **Authentication**: 이메일/비밀번호 + Google 로그인 활성화
- **Firestore Database**: 프로덕션 모드로 생성 (지역: `asia-northeast3` = 서울)

### 3단계: firebase-config.js 설정
Firebase Console → 프로젝트 설정 → 내 앱 → "웹 앱 추가"
생성된 설정값을 `js/firebase-config.js`의 `FIREBASE_CONFIG` 객체에 복사

### 4단계: Firestore 보안 규칙 적용
`firestore.rules` 파일 내용을 Firebase Console → Firestore → 규칙 탭에 붙여넣기

### 5단계: GitHub 연동 및 배포
```bash
git init
git add .
git commit -m "추담공원 초기 배포"
git remote add origin https://github.com/YOUR_ID/choodam.git
git push -u origin main
```

Firebase Hosting 또는 GitHub Pages로 배포:
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 👤 관리자 계정 설정
1. 앱에서 관리자로 쓸 이메일로 회원가입
2. Firebase Console → Firestore → `users` 컬렉션
3. 해당 UID 문서에서 `role` 필드를 `"admin"` 으로 수정

## 📊 데이터 입력 순서
관리자 로그인 후 → 문중 관리 → 관리자 메뉴 → 인물 등록

### 인물 등록 순서 (중요!)
1. **7대조 등록** (generation: 1, parentId: 없음)
   → 저장 후 나오는 ID를 복사해두기
2. **6대조 등록** (generation: 2, parentId: 위 ID, rootAncestorId: 위 ID)
3. **5대조 ~ 현재 세대** 순서로 등록

## 🔧 Firestore 컬렉션 구조
```
/users/{uid}
  name, bongwan, pa, saesu, daeson, email, role, personId

/persons/{id}
  name, hanja, surname, bongwan, pa,
  generation, birthYear, deathYear,
  parentId, rootAncestorId,
  memorialLocation, jesaDate

/mergeRequests/{id}
  fromUid, toUid, fromPersonId, toPersonId,
  commonAncestorId, status (pending/accepted/rejected)
```

## ❓ 자주 묻는 질문
- **아이콘이 없다**: `icons/` 폴더에 192x192, 512x512 PNG 파일을 넣어주세요
- **가계도가 안 보인다**: 관리자 계정으로 인물을 먼저 등록해야 합니다
- **매칭이 안 된다**: 두 사용자의 7대조 성함/본관/파가 완전히 일치해야 합니다
