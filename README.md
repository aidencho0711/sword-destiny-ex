# Sword Destiny - ex

검 뽑기 웹게임. 빌드 과정 없는 정적 사이트입니다.

## 실행

```bash
python3 -m http.server 8000
```

`http://localhost:8000` 접속. 서비스 워커와 홈 화면 설치는 HTTPS 또는 localhost에서만 동작하므로
`file://`로 직접 열지 마세요.

## 구조

| 경로 | 내용 |
|---|---|
| `index.html` | 마크업 셸 |
| `css/game.css` | 전체 스타일 |
| `js/01~11-*.js` | 게임 로직 (번호 순서대로 로드됨) |
| `sw.js` | 오프라인 캐시 |

`js/*.js`는 ES module이 아니라 classic script입니다. 전역 스코프를 공유하며
**로드 순서가 곧 실행 순서**입니다. 파일을 추가하면 `index.html`과 `sw.js` 양쪽에 등록하세요.

## 수정 후 배포

1. 파일 수정
2. `sw.js`의 `CACHE` 버전 숫자를 올림 (안 올리면 기존 방문자에게 반영되지 않음)
3. 폴더를 그대로 Netlify Drop / Cloudflare Pages / GitHub Pages에 업로드

## 상세 지침

작업 규칙, 알려진 함정, 밸런스 설계 원칙은 `CLAUDE.md`를 보세요.
