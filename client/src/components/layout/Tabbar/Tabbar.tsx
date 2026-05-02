"use client";

import type { ReactNode } from "react";
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
  label: string;
  Icon: LucideIcon;
}[] = [
  { id: "recipe", label: "레시피", Icon: CookingPot },
  { id: "chatbot", label: "챗봇", Icon: MessageCircle },
  { id: "inventory", label: "보관함", Icon: Package },
  { id: "mypage", label: "마이페이지", Icon: User },
] as const;

export interface TabbarProps {
  className?: string;
  /** 현재 선택된 탭 */
  activeId: TabbarTabId;
  /** 탭 선택 시 (라우팅·상태 반영은 상위에서 처리) */
  onSelect: (id: TabbarTabId) => void;
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

export function Tabbar({ className = "", activeId, onSelect }: TabbarProps) {
  return (
    <nav
      className={cn("w-full border-t border-border-subtle bg-background-surface", className)}
      aria-label={buildAriaLabel("section", "하단 탭")}
    >
      <div className="mx-auto flex w-full max-w-(--layout-content-max-width) items-start gap-6 px-6 py-3">
        {TABS.map(({ id, label, Icon }) => {
          const selected = activeId === id;
          return (
            <TabButtonWrapper key={id}>
              <button
                type="button"
                className="flex px-1 min-h-11 flex-col items-center justify-center border-0 bg-transparent p-0 text-center transition-colors focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default"
                aria-current={selected ? "page" : undefined}
                onClick={() => onSelect(id)}
              >
                <TabButton selected={selected} label={label} Icon={Icon} />
              </button>
            </TabButtonWrapper>
          );
        })}
      </div>
    </nav>
  );
}
