"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CookingPot,
  MessageCircle,
  Package,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { buildAriaLabel } from "@/lib/utils/a11y";

/**
 * Figma `Tabbar` (node 167:3234): Surface·상단 Border/Subtle, 가로 `gap-6`·`px-6`·`py-3`.
 * 각 열은 `TabButtonWrapper`(균등 너비), 안쪽 시각 묶음은 `TabButton`(아이콘·라벨 `gap-1`).
 */
export const TABBAR_TAB_IDS = ["recipe", "chatbot", "inventory", "mypage"] as const;

export type TabbarTabId = (typeof TABBAR_TAB_IDS)[number];

const TABS: readonly {
  id: TabbarTabId;
  href: string;
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "recipe", href: "/recipe", label: "레시피", Icon: CookingPot },
  { id: "chatbot", href: "/chatbot", label: "챗봇", Icon: MessageCircle },
  { id: "inventory", href: "/inventory", label: "보관함", Icon: Package },
  { id: "mypage", href: "/mypage", label: "마이페이지", Icon: User },
] as const;

/**
 * 현재 pathname에 맞는 하단 탭 id (일치 또는 하위 경로). 매칭 없으면 `recipe`.
 * Storybook 등에서 `usePathname()`이 `null`/`undefined`일 수 있으므로 방어한다.
 */
export function tabbarTabIdFromPathname(pathname: string | null | undefined): TabbarTabId {
  const path = pathname ?? "";
  for (const { id, href } of TABS) {
    if (path === href || path.startsWith(`${href}/`)) return id;
  }
  return "recipe";
}

export interface TabbarProps {
  className?: string;
  /**
   * 선택된 탭. 생략 시 `usePathname()`으로 {@link tabbarTabIdFromPathname} 계산.
   * Storybook 등 경로가 없을 때는 임의 값을 넘긴다.
   */
  activeId?: TabbarTabId;
  /** 탭 클릭 시 추가 처리(분석 등). `preventLinkNavigation`이 true면 필수에 가깝게 사용 */
  onSelect?: (id: TabbarTabId) => void;
  /**
   * true면 `click`에서 기본 네비게이션을 막고 `onSelect`만 호출.
   * Storybook 등 앱 라우터 밖에서 링크 동작을 쓰지 않을 때
   */
  preventLinkNavigation?: boolean;
}

/** Figma `TabButtonWrapper`: 탭 열 레이아웃( flex-1 · 가로 중앙 정렬 ). */
function TabButtonWrapper({
  className = "",
  children,
}: Readonly<{ className?: string; children: ReactNode }>) {
  return (
    <div className={cn("relative flex min-h-px min-w-px flex-1 flex-col items-center", className)}>
      {children}
    </div>
  );
}

/** Figma `TabButton`: 아이콘 + 라벨 수직 스택(`gap-1`), `shrink-0`. */
function TabButton({
  selected,
  label,
  Icon,
}: Readonly<{
  selected: boolean;
  label: string;
  Icon: LucideIcon;
}>) {
  return (
    <span className="relative flex shrink-0 flex-col items-center justify-center gap-1">
      <Icon
        className={cn("size-6 shrink-0", selected ? "style-text-tab-active" : "style-text-tab-inactive")}
        strokeWidth={2}
        aria-hidden
      />
      <span className={cn("typo-label-tab", selected ? "style-text-tab-active" : "style-text-tab-inactive")}>
        {label}
      </span>
    </span>
  );
}

const tabLinkClassName =
  "flex min-h-11 flex-col items-center justify-center border-0 bg-transparent px-1 p-0 text-center no-underline transition-colors focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default";

export function Tabbar({
  className = "",
  activeId: activeIdProp,
  onSelect,
  preventLinkNavigation = false,
}: TabbarProps) {
  const pathname = usePathname();
  const activeId = activeIdProp ?? tabbarTabIdFromPathname(pathname);

  return (
    <nav
      className={cn("w-full border-t border-border-subtle bg-background-surface", className)}
      aria-label={buildAriaLabel("section", "하단 탭")}
    >
      <div className="mx-auto flex w-full max-w-(--layout-content-max-width) items-start gap-6 px-6 py-3">
        {TABS.map(({ id, href, label, Icon }) => {
          const selected = activeId === id;
          return (
            <TabButtonWrapper key={id}>
              <Link
                href={href}
                className={tabLinkClassName}
                aria-current={selected ? "page" : undefined}
                onClick={(e) => {
                  if (preventLinkNavigation) e.preventDefault();
                  onSelect?.(id);
                }}
              >
                <TabButton selected={selected} label={label} Icon={Icon} />
              </Link>
            </TabButtonWrapper>
          );
        })}
      </div>
    </nav>
  );
}
