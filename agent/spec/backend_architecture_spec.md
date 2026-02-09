# 백엔드 아키텍처 모듈 명세서

에이전트가 **무엇을** 개발할지 **파일·디렉터리 단위**로 정의하는 정형 명세이다. 원칙·방법론·구현 가이드는 `../guidelines/backend_development_guidelines.md`, 스펙 주도 개발 원칙은 `../guidelines/spec_driven_development_guidelines.md`에 정의되어 있다.

**경로 표기 규칙** (패키지별 명세 공통): 아래 표에서 사용하는 경로는 별도 언급이 없는 한 모두 **저장소 루트 기준 절대 경로**이며, 패키지 루트 경로(`server/producer/`, `server/consumer/`, `server/shared/`)를 포함해 표기한다. `*`는 해당 디렉터리 내의 임의의 파일·하위 경로를 의미하며, 구체적인 파일 이름·개수는 구현 시 결정한다. 표에서 **굵게 표시된 경로**는 디렉터리(그룹)를 의미하고, 그 아래 행들이 해당 디렉터리 내부의 파일·세부 경로와 역할을 정의한다.

---

## 패키지별 명세

| 패키지 | 문서 |
|--------|------|
| **Producer** (@cook/producer) | [backend_architecture_spec_producer.md](backend_architecture_spec_producer.md) |
| **Consumer** (@cook/consumer) | [backend_architecture_spec_consumer.md](backend_architecture_spec_consumer.md) |
| **Shared** (@cook/shared) | [backend_architecture_spec_shared.md](backend_architecture_spec_shared.md) |

각 문서에서 공통 규칙·경로 표기는 위 내용을 따르며, 패키지별 파일·디렉터리 명세와 계약·스키마는 해당 링크 문서에 정의되어 있다.
