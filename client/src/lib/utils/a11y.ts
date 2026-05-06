/**
 * 접근성(a11y) 관련 공용 유틸.
 */

export type A11yElementType =
  | 'button'
  | 'link'
  | 'input'
  | 'section'
  | 'image'
  | 'generic';

/**
 * `name`이 비었을 때 접미 규칙에 넣을 기본 이름 (호출부에서 throw 하지 않도록 여기서만 처리).
 */
const A11Y_LABEL_NAME_FALLBACK: Record<A11yElementType, string> = {
  button: '동작',
  link: '페이지',
  input: '내용',
  section: '콘텐츠',
  image: '표시',
  generic: '항목',
};

/**
 * 엘리먼트 유형별 기본 aria-label을 생성한다.
 *
 * 규칙:
 * - button: `{이름} 버튼`
 * - link: `{이름}로 이동하기`
 * - input: `{이름} 입력`
 * - section: `{이름} 영역`
 * - image: `{이름} 이미지`
 * - generic: `{이름}`
 *
 * `name`이 공백뿐이면 타입별 기본 이름으로 치환한 뒤 같은 규칙을 적용한다.
 */
export function buildAriaLabel(type: A11yElementType, name: string): string {
  const normalizedName = name.trim();
  const effectiveName =
    normalizedName.length > 0 ? normalizedName : A11Y_LABEL_NAME_FALLBACK[type];

  switch (type) {
    case 'button':
      return `${effectiveName} 버튼`;
    case 'link':
      return `${effectiveName}로 이동하기`;
    case 'input':
      return `${effectiveName} 입력`;
    case 'section':
      return `${effectiveName} 영역`;
    case 'image':
      return `${effectiveName} 이미지`;
    case 'generic':
    default:
      return effectiveName;
  }
}
