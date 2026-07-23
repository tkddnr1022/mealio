'use client';

import {
  LegalDocumentView,
  LegalSection,
} from '@/components/layout/LegalDocumentView';
import { APP_BRAND_NAME } from '@/lib/constants/app.constants';

const EFFECTIVE_DATE = '2026년 7월 23일';

export function PrivacyClientPage() {
  return (
    <LegalDocumentView title="개인정보 처리방침" effectiveDate={EFFECTIVE_DATE}>
      <LegalSection title="1. 안내">
        <p className="m-0">
          {APP_BRAND_NAME}(이하 &quot;서비스&quot;)는 오픈소스 프로젝트의{' '}
          <span className="typo-body-medium">데모 환경</span>입니다. 본 문서는
          데모 이용 시 어떤 정보가 처리되는지 투명하게 알리기 위한 안내이며,
          상용 서비스 수준의 고객센터·전담 조직을 전제로 하지 않습니다.
        </p>
      </LegalSection>

      <LegalSection title="2. 수집·이용 목적">
        <ul className="m-0 list-disc space-y-1 pl-5">
          <li>데모 로그인·계정 식별 및 세션 유지</li>
          <li>레시피 추천·보관함·챗봇 등 데모 기능 제공</li>
          <li>오류·남용 방지, 데모 품질 확인(로그·관측)</li>
        </ul>
        <p className="m-0">
          수집 정보를 광고 판매·무관한 마케팅에 사용하지 않습니다.
        </p>
      </LegalSection>

      <LegalSection title="3. 수집 항목">
        <ul className="m-0 list-disc space-y-1 pl-5">
          <li>
            <span className="typo-body-medium">계정</span>: 소셜 로그인으로
            제공되는 이메일, 닉네임(또는 표시명), 제공자명·제공자 식별자
          </li>
          <li>
            <span className="typo-body-medium">이용 데이터</span>: 보유·관심
            재료, 관심 레시피, 검색·조회·활동 기록, 챗봇 대화
          </li>
          <li>
            <span className="typo-body-medium">기술 로그</span>: 접속 시각,
            User-Agent, 쿠키/세션, 오류·요청 로그 등
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. 보유·파기">
        <p className="m-0">
          데모 목적 달성·계정 정리·인프라 재배포 시 데이터를 삭제할 수 있습니다.
          챗봇 기록·활동 로그 등은 정책상 단기 보관(예: 대화 약 30일, 활동 로그
          약 90일) 후 만료될 수 있으며,{' '}
          <span className="typo-body-medium">예고 없이 전체 초기화</span>될 수도
          있습니다. 장기간 보관이 필요한 정보는 입력하지 마세요.
        </p>
      </LegalSection>

      <LegalSection title="5. 처리에 관여하는 외부 서비스">
        <p className="m-0">
          데모 기능 제공을 위해 아래와 같은 외부 처리가 발생할 수 있습니다.
        </p>
        <ul className="m-0 list-disc space-y-1 pl-5">
          <li>소셜 로그인 제공자(Google, Kakao, Naver 등): 인증</li>
          <li>호스팅·클라우드: 앱·DB·캐시·메시지 큐 운영</li>
          <li>LLM 제공자(예: OpenAI): 챗봇 응답 생성</li>
          <li>관측·분석 도구(해당 시): 오류·성능·이용 지표</li>
        </ul>
        <p className="m-0">
          챗봇 등에 입력한 내용은 위 LLM 처리 과정에서 국외로 전송될 수
          있습니다. 민감한 개인정보는 입력하지 마세요.
        </p>
      </LegalSection>

      <LegalSection title="6. 쿠키">
        <p className="m-0">
          로그인 유지·보안을 위해 인증 쿠키 등을 사용합니다. 브라우저에서 쿠키를
          차단하면 로그인 기능이 동작하지 않을 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="7. 이용자 요청">
        <p className="m-0">
          닉네임 등 일부 정보는 마이페이지에서 수정할 수 있습니다. 계정·데이터
          삭제 등 기타 요청은 공개 저장소(GitHub Issues 등)로 문의해 주세요.
          데모 환경 특성상 즉시 처리가 어려울 수 있으며, 전체 초기화로 대체될 수
          있습니다.
        </p>
      </LegalSection>

      <LegalSection title="8. 안전 조치">
        <p className="m-0">
          HTTPS, 접근 통제, 세션·토큰 기반 인증 등 기본적인 보호를 적용합니다.
          다만 데모·오픈소스 환경이므로 상용 서비스와 동일한 수준의
          보안·가용성을 보장하지는 않습니다.
        </p>
      </LegalSection>

      <LegalSection title="9. 변경">
        <p className="m-0">
          본 안내문은 데모 운영에 맞춰 수시로 수정될 수 있으며, 본 페이지 게시
          시점부터 적용됩니다.
        </p>
      </LegalSection>

      <LegalSection title="부칙">
        <p className="m-0">본 방침은 {EFFECTIVE_DATE}부터 적용합니다.</p>
      </LegalSection>
    </LegalDocumentView>
  );
}
