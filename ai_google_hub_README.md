# Google Drive Hub 📁

엔터프라이즈 환경을 위한 모던하고 직관적인 구글 드라이브 관리 시스템입니다. Pinterest 스타일의 UI와 강력한 검색, 관리자 기능을 제공합니다.

## ✨ 주요 기능

- **🔐 보안 인증**: NextAuth.js를 이용한 안전한 구글 로그인 (OAuth 2.0).
- **📂 파일 탐색**:
    - Pinterest 스타일의 반응형 그리드 레이아웃.
    - 이미지, 비디오 썸네일 및 미리보기 지원.
- **🚀 파일 작업**:
    - **업로드**: 드래그 앤 드롭을 지원하는 대용량 파일 업로드 (메타데이터 포함).
    - **다운로드**: 스트리밍 방식을 이용한 안전한 파일 다운로드.
    - **미리보기**: 앱 내에서 이미지 및 비디오 즉시 미리보기.
- **🔍 검색 및 필터**:
    - 실시간 디바운스 검색 (이름, 내용).
    - 파일 유형별(이미지, 영상, 문서 등) 필터링.
- **📊 관리자 대시보드**:
    - **스토리지 통계**: 드라이브 사용량 및 할당량 시각화.
    - **사용자 관리**: 팀원 초대 및 권한 관리 (UI 시뮬레이션).

## 🛠️ 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4, Lucide React
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **API Integration**: Google Drive API v3 (googleapis)
- **Auth**: NextAuth.js

## 🚀 시작하기

### 1. 프로젝트 설치
```bash
git clone <repository-url>
cd ai_hub
npm install
```

### 2. 환경 변수 설정
루트 경로에 `.env.local` 파일을 생성하고 다음 값을 입력하세요:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000`으로 접속하여 확인합니다.

---
Developed by Antigravity using **Next.js** & **Google Platform**.
