'use client';

import {
  LegalDocumentView,
  LegalSection,
} from '@/components/layout/LegalDocumentView';
import { APP_BRAND_NAME } from '@/lib/constants/app.constants';

const EFFECTIVE_DATE = '2026년 7월 23일';

export function TermsClientPage() {
  return (
    <LegalDocumentView title="이용약관" effectiveDate={EFFECTIVE_DATE}>
      <LegalSection title="1. 서비스 성격">
        <p className="m-0">
          {APP_BRAND_NAME}(이하 &quot;서비스&quot;)는 학습·포트폴리오·기술
          시연을 위한 <span className="typo-body-medium">오픈소스 데모</span>
          입니다. 상용 서비스가 아니며, 별도의 사업자·유료 구독·고객 지원을
          전제로 하지 않습니다. 소스 코드는 MIT 라이선스로 공개되어 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="2. 제공 기능">
        <p className="m-0">
          데모 환경에서 다음 기능을 체험할 수 있습니다. 기능·데이터·가용성은
          예고 없이 변경되거나 중단될 수 있습니다.
        </p>
        <ul className="m-0 list-disc space-y-1 pl-5">
          <li>레시피 목록·검색·필터·상세 및 맞춤 추천</li>
          <li>보유·관심 재료, 관심 레시피(보관함)</li>
          <li>AI 챗봇(데모용 크레딧·한도 적용 가능)</li>
          <li>소셜 로그인(OAuth) 기반 계정·마이페이지</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. 계정 및 데이터">
        <p className="m-0">
          계정은 Google·Kakao·Naver 등 소셜 로그인으로 생성될 수 있습니다.
          데모 특성상 계정·보관함·대화·활동 기록 등은 점검·재배포·용량 관리
          등의 이유로{' '}
          <span className="typo-body-medium">사전 고지 없이 초기화·삭제</span>될
          수 있습니다. 중요한 정보는 서비스에 의존해 보관하지 마세요.
        </p>
      </LegalSection>

      <LegalSection title="4. 이용 시 유의사항">
        <ul className="m-0 list-disc space-y-1 pl-5">
          <li>서비스를 과부하·악용하거나 타인의 계정을 도용하지 않습니다.</li>
          <li>
            레시피·영양·챗봇 응답은 참고용이며, 건강·알레르기·안전에 대한
            전문 조언을 대체하지 않습니다.
          </li>
          <li>
            공공데이터·제3자 API·LLM 응답의 정확성·연속성을 보장하지
            않습니다.
          </li>
          <li>
            데모 크레딧은 체험용이며 환불·양도·금전적 가치가 없습니다.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. 책임의 제한">
        <p className="m-0">
          서비스와 관련 소프트웨어는 &quot;있는 그대로(AS IS)&quot; 제공됩니다.
          데모 중단, 데이터 손실, 오작동, 제3자 서비스(OAuth·LLM·호스팅 등)
          장애로 인한 손해에 대해, 관련 법령이 허용하는 범위에서
          운영자·기여자는 책임을 지지 않습니다. MIT 라이선스의 면책 조항이
          함께 적용됩니다.
        </p>
      </LegalSection>

      <LegalSection title="6. 오픈소스 및 콘텐츠">
        <p className="m-0">
          저장소 코드의 이용·복제·수정·배포는 MIT 라이선스를 따릅니다. 레시피
          등 일부 데이터는 공공데이터·외부 출처에 기반할 수 있으며, 해당 출처의
          이용 조건을 함께 확인하세요. 서비스 UI에 표시되는 브랜드명·디자인은
          데모 식별을 위한 것이며, 상업적 오해를 유도하지 않도록 사용해
          주세요.
        </p>
      </LegalSection>

      <LegalSection title="7. 약관 변경">
        <p className="m-0">
          데모 운영에 맞춰 본 문서를 수시로 갱신할 수 있습니다. 변경 내용은
          본 페이지에 게시된 시점부터 적용됩니다.
        </p>
      </LegalSection>

      <LegalSection title="부칙">
        <p className="m-0">본 약관은 {EFFECTIVE_DATE}부터 적용합니다.</p>
      </LegalSection>
    </LegalDocumentView>
  );
}
