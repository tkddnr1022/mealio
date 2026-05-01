import { User } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type UserProfileProps = Readonly<
  Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    className?: string;
    loggedIn?: boolean;
    nickname?: string;
    email?: string;
    message?: string;
  }
>;

export function UserProfile({
  className = "",
  loggedIn = true,
  nickname = "Nickname",
  email = "recipe@example.com",
  message = "로그인이 필요합니다",
  ...rest
}: UserProfileProps) {
  return (
    <section
      className={cn("flex w-full items-center gap-4", className)}
      data-name="UserProfile"
      {...rest}
    >
      <span
        aria-hidden
        className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-dropdown-selected-default style-text-accent"
      >
        <User className="size-8" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        {loggedIn ? (
          <>
            <h2 className="truncate typo-h2 style-text-primary">{nickname}</h2>
            <p className="truncate typo-caption-regular style-text-secondary">{email}</p>
          </>
        ) : (
          <h2 className="truncate typo-h2 style-text-primary">{message}</h2>
        )}
      </div>
    </section>
  );
}
