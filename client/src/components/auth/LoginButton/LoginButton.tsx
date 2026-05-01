import type { ButtonHTMLAttributes } from 'react';
import { type OAuthProvider } from '@/lib/types/auth';
import { cn } from '@/lib/utils/cn';

export interface LoginButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
className?: string;
provider?: OAuthProvider;
}

const PROVIDER_META: Record<
  OAuthProvider,
  Readonly<{
    label: string;
    className: string;
    iconSrc: string;
  }>
> = {
  kakao: {
    label: '카카오 로그인',
    className: 'bg-provider-kakao-primary text-provider-kakao-on-primary',
    iconSrc: '/oauth/kakao.svg',
  },
  naver: {
    label: '네이버 로그인',
    className: 'bg-provider-naver-primary text-provider-naver-on-primary',
    iconSrc: '/oauth/naver.svg',
  },
  google: {
    label: '구글 로그인',
    className: 'bg-provider-google-primary text-provider-google-on-primary',
    iconSrc: '/oauth/google.svg',
  },
};

export function LoginButton({
  className = '',
  provider = 'kakao',
  type = 'button',
  ...rest
}: LoginButtonProps) {
  const {
    label,
    className: providerClassName,
    iconSrc,
  } = PROVIDER_META[provider];

  return (
    <button
      type={type}
      className={cn(
        'flex w-full items-center justify-between rounded-xl px-4 py-4 outline-none transition-opacity hover:opacity-90 focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default',
        providerClassName,
        className,
      )}
      data-name="LoginButton"
      {...rest}
    >
      <img src={iconSrc} alt="" aria-hidden className="size-4 shrink-0" />
      <span className="typo-label-dropdown text-center">{label}</span>
      <span aria-hidden className="w-4 shrink-0" />
    </button>
  );
}
