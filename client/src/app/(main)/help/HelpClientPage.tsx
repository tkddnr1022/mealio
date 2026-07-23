'use client';

import {
  LegalDocumentView,
  LegalSection,
} from '@/components/layout/LegalDocumentView';
import { APP_BRAND_NAME } from '@/lib/constants/app.constants';

export function HelpClientPage() {
  return (
    <LegalDocumentView title="도움말">
      <LegalSection title="Mealio란?">
        <p className="m-0">
          {APP_BRAND_NAME}는 보유·관심 재료와 이용 기록을 바탕으로 레시피를
          찾고, AI 챗봇으로 요리 질문을 해볼 수 있는{' '}
          <span className="typo-body-medium">오픈소스 데모</span>입니다. 상용
          서비스가 아니며, 기능·데이터는 예고 없이 바뀔 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="시작하기">
        <ul className="m-0 list-disc space-y-1 pl-5">
          <li>
            하단 탭의 <span className="typo-body-medium">마이페이지</span>에서
            로그인하거나, 챗봇·보관함 등 보호된 메뉴로 들어가면 로그인 화면으로
            이동합니다.
          </li>
          <li>
            Google·Kakao·Naver 소셜 로그인만 지원하며, 별도 이메일 가입은
            없습니다.
          </li>
          <li>
            레시피 목록·검색·상세는 로그인 없이도 둘러볼 수 있습니다.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="레시피">
        <ul className="m-0 list-disc space-y-1 pl-5">
          <li>
            <span className="typo-body-medium">메인</span>: 최신·인기 등 공개
            섹션과, 로그인 시 맞춤 추천을 확인합니다.
          </li>
          <li>
            <span className="typo-body-medium">검색</span>: 키워드로 레시피를
            찾고, 상세에서 재료·조리 순서를 봅니다.
          </li>
          <li>
            <span className="typo-body-medium">필터</span>: 카테고리 등으로
            목록을 좁힙니다.
          </li>
          <li>
            관심 있는 레시피는 하트 등으로 보관함에 저장할 수 있습니다(로그인
            필요).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="보관함">
        <ul className="m-0 list-disc space-y-1 pl-5">
          <li>
            <span className="typo-body-medium">보유 재료</span>: 지금 가지고
            있는 재료를 등록합니다.
          </li>
          <li>
            <span className="typo-body-medium">관심 재료</span>: 자주 쓰는·사고
            싶은 재료를 모아 둡니다.
          </li>
          <li>
            <span className="typo-body-medium">관심 레시피</span>: 저장한
            레시피를 다시 엽니다.
          </li>
          <li>
            재료 추가는 재료 필터/검색 화면에서 고른 뒤 저장합니다.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="챗봇">
        <ul className="m-0 list-disc space-y-1 pl-5">
          <li>
            대화 목록에서 새 대화를 시작하거나 이전 대화를 이어갑니다.
          </li>
          <li>
            재료·레시피·보관함 정보를 바탕으로 추천·요리 안내를 받을 수
            있습니다. 응답은 참고용입니다.
          </li>
          <li>
            데모에서는 <span className="typo-body-medium">크레딧</span>이
            차감될 수 있으며, 한도·잔액은 마이페이지에서 확인합니다. 크레딧은
            체험용이며 환불되지 않습니다.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="마이페이지">
        <ul className="m-0 list-disc space-y-1 pl-5">
          <li>닉네임 수정, 활동 내역, 크레딧 사용량을 확인합니다.</li>
          <li>이용약관·개인정보 처리방침·로그아웃은 메뉴에서 이동합니다.</li>
        </ul>
      </LegalSection>

      <LegalSection title="자주 묻는 질문">
        <p className="m-0 typo-body-medium">데이터가 갑자기 사라졌어요</p>
        <p className="m-0">
          데모 환경은 점검·재배포·용량 관리로 계정·보관함·대화가 초기화될 수
          있습니다. 중요한 정보는 서비스에 의존해 보관하지 마세요.
        </p>
        <p className="m-0 typo-body-medium">로그인이 안 돼요</p>
        <p className="m-0">
          소셜 로그인 동의 취소, 쿠키 차단, 세션 만료가 원인일 수 있습니다.
          브라우저 쿠키를 허용한 뒤 다시 시도해 보세요.
        </p>
        <p className="m-0 typo-body-medium">챗봇 답변이 이상해요</p>
        <p className="m-0">
          AI 응답은 참고 정보이며 의료·안전·알레르기 판단을 대체하지 않습니다.
          레시피·공공데이터·모델 한계로 부정확한 내용이 나올 수 있습니다.
        </p>
        <p className="m-0 typo-body-medium">문의는 어디로 하나요?</p>
        <p className="m-0">
          상용 고객센터는 없습니다. 버그·질문·제안은 GitHub 저장소 Issues로
          남겨 주세요. 문서는 docs.mealio.site에서도 확인할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="관련 링크">
        <ul className="m-0 list-disc space-y-1 pl-5">
          <li>데모: mealio.site</li>
          <li>문서: docs.mealio.site</li>
          <li>소스: github.com/tkddnr1022/mealio (MIT)</li>
        </ul>
      </LegalSection>
    </LegalDocumentView>
  );
}
