# Raycast Gemini Prompt Helper

Google Gemini AI를 활용한 향상된 프롬프팅 Raycast 확장 프로그램입니다.

## 기능

- 선택된 텍스트나 직접 입력한 쿼리를 Gemini AI에 전달
- 미리 정의된 시스템 프롬프트를 통한 일관된 응답 품질
- 응답 결과를 클립보드에 자동 복사

## 설치 방법

1. 이 저장소를 클론합니다
2. 의존성 패키지를 설치합니다:
   ```bash
   npm install
   ```
3. Google API 키를 설정합니다:
   - Raycast 설정에서 확장 프로그램 설정으로 이동
   - `GOOGLE_API_KEY` 환경 변수에 API 키를 입력

## 개발

```bash
npm run dev
```

## 빌드

```bash
npm run build
```

## 라이선스

MIT
