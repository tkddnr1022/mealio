import { MessageCircle, Package } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { StatCard, type StatCardProps } from "@/components/mypage/StatCard";
import { UserProfile, type UserProfileProps } from "@/components/mypage/UserProfile";

export type MypageHeaderProps = Readonly<
  Omit<HTMLAttributes<HTMLElement>, "children"> & {
    className?: string;
    loggedIn?: boolean;
    userProfileProps?: Omit<UserProfileProps, "loggedIn">;
    statCards?: readonly StatCardProps[];
  }
>;

const DEFAULT_STAT_CARDS: readonly StatCardProps[] = [
  { value: "24", label: "저장한 레시피" },
  { value: "12", label: "보유 재료", icon: <Package className="size-5" strokeWidth={2} /> },
  { value: "10", label: "챗봇 대화", icon: <MessageCircle className="size-5" strokeWidth={2} /> },
];

export function MypageHeader({
  className = "",
  loggedIn = true,
  userProfileProps,
  statCards = DEFAULT_STAT_CARDS,
  ...rest
}: MypageHeaderProps) {
  return (
    <header
      className={cn(
        "flex w-full flex-col items-start gap-6 bg-background-surface px-4 py-6 shadow-(--semantic-shadow-sm)",
        className,
      )}
      data-name="MypageHeader"
      {...rest}
    >
      <UserProfile
        loggedIn={loggedIn}
        {...userProfileProps}
        message={userProfileProps?.message ?? "로그인이 필요합니다"}
      />
      {loggedIn && (
        <div className="flex w-full items-center gap-4">
          {statCards.map((stat, index) => (
            <StatCard key={stat.label ?? `mypage-stat-${index}`} {...stat} className={cn("min-w-px flex-1", stat.className)} />
          ))}
        </div>
      )}
    </header>
  );
}
