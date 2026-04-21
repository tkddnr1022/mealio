# 디자인 시스템 연동 가이드라인

이 문서는 디자인 시스템 워크플로우의 3단계인  
**`agent/design/spec/design_tokens.json` -> 코드** 반영 절차를 정의한다.

---

## 1. 목적

- `design_tokens.json`의 변수/스타일 목록을 코드 레이어로 변환한다.
- 대상 코드는 `client/src/app/globals.css`다.

---

## 2. 입력과 출력

- 입력
  - `agent/design/spec/design_tokens.json`
- 출력
  - `client/src/app/globals.css`

---

## 3. 핵심 원칙

- 토큰 이름은 의미를 유지한 채 CSS 변수로 변환한다.
- 변환 규칙:
  - dot-path: `color.background.default`
  - CSS 변수: `--color-background-default`
- 변수명은 라이트/다크에서 동일하고 값만 바뀐다.
- `@theme`에는 토큰만 선언한다. (`--color-*`, `--text-*`, `--radius-*` 등)
- 라이트/다크 분기는 토큰 선언이 아니라 값 주입 레이어(`:root`, `.dark`)에서 처리한다.
- Figma 스타일은 `@layer components`에서 클래스 recipe로만 생성한다.
- 스타일 클래스 접두사를 강제한다.
  - 텍스트 스타일: `.typo-*`
  - 색상/효과 스타일: `.style-text-*`
- 클래스 recipe(`.typo-*`, `.style-text-*`)에서는 HEX/고정값을 직접 쓰지 않고 `var(--token)`만 사용한다.

---

## 4. 반영 절차

## 4.1 토큰을 `globals.css`의 `@theme`에 반영

- `design_tokens.json`의 토큰만 `@theme`에 선언한다.
- 토큰 네임스페이스는 용도별 prefix를 유지한다. (`--color-*`, `--text-*`, `--radius-*`)
- 다크 모드 값은 토큰 변수명을 바꾸지 않고 값만 override 한다.
- 기본값은 `:root`에, 다크값은 `.dark`에 주입한다.

권장 구조:

예시:

```css
@theme {
  --color-background-default: var(--ref-color-background-default);
  --color-text-primary: var(--ref-color-text-primary);
  --text-h3: 18px;
  --radius-xl: 12px;
}

.theme-light,
:root {
  --ref-color-background-default: #ffffff;
  --ref-color-text-primary: #1c1a17;
}

.dark {
  --ref-color-background-default: #111111;
  --ref-color-text-primary: #f5f5f4;
}
```

## 4.2 Figma 스타일을 `@layer components` 클래스 recipe로 반영

- 스타일(`styles`)은 토큰에 alias 연결만 유지하고, 실제 사용은 클래스 recipe로 제공한다.
- 텍스트 스타일 클래스는 `.typo-*` 규칙을 따른다.
- 색상/효과 스타일 클래스는 `.style-text-*` 규칙을 따른다.
- 클래스는 모드별 값을 직접 가지지 않고 토큰 참조만 수행한다.

예시:

```css
@layer components {
  .typo-card-heading {
    font-size: var(--text-h3);
    line-height: 27px;
    font-weight: var(--font-weight-medium);
  }

  .style-text-primary {
    color: var(--color-text-primary);
  }
}
```

## 4.3 사용 규칙

- 직접 사용: `background-color: var(--color-background-default);`
- 텍스트 스타일 클래스: `typo-*`
- 색상/효과 스타일 클래스: `style-text-*`

예시:

```tsx
<h3 className="typo-card-heading style-text-primary">카드 제목</h3>
```

---

## 5. 검증 체크리스트

- `design_tokens.json`의 대상 변수/스타일이 누락 없이 반영됐는가
- `@theme`에 토큰만 선언됐는가
- `.dark`에 같은 변수명이 사용됐는가
- 모드 분기가 `:root`/`.dark` 값 주입 레이어로만 분리됐는가
- Figma 스타일이 `@layer components` 클래스 recipe로 반영됐는가
- `.typo-*`, `.style-text-*` 접두사 규칙이 지켜졌는가
- 클래스 recipe에 토큰 외 하드코딩 값(HEX 등)이 없는가
- 기존 클래스/토큰 네이밍 체계와 충돌하지 않는가

---

## 6. 워크플로우 위치

- 1단계(수집): `design_system_collection_guidelines.md`
- 2단계(변환): `design_tokens_conversion_guidelines.md`
- 3단계(연동): 현재 문서
