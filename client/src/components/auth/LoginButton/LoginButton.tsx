import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { type OAuthProvider } from '@/lib/types/auth';
import { cn } from '@/lib/utils/cn';
import { NavLink } from '@/components/ui/NavLink';

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

type LoginButtonShared = Readonly<{
  className?: string;
  provider?: OAuthProvider;
}>;

export type LoginButtonProps = LoginButtonShared &
  (
    | (Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
        href?: undefined;
      })
    | (Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & {
        href: string;
      })
  );

export function LoginButton(props: LoginButtonProps) {
  const className = props.className ?? '';
  const provider = props.provider ?? 'kakao';
  const {
    label,
    className: providerClassName,
    iconSrc,
  } = PROVIDER_META[provider];

  const surfaceClass = cn(
    'flex w-full items-center justify-between rounded-xl px-4 py-4 outline-none transition-opacity hover:opacity-90 focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default',
    providerClassName,
    className,
  );

  const inner = (
    <>
      <img src={iconSrc} alt="" aria-hidden className="size-4 shrink-0" />
      <span className="typo-label-dropdown text-center">{label}</span>
      <span aria-hidden className="w-4 shrink-0" />
    </>
  );

  if ('href' in props && props.href !== undefined) {
    const {
      href,
      provider: omitProvider,
      className: omitClassName,
      ...anchorRest
    } = props as Extract<LoginButtonProps, { href: string }>;
    void omitProvider;
    void omitClassName;
    return (
      <NavLink
        href={href}
        className={surfaceClass}
        data-name="LoginButton"
        {...anchorRest}
      >
        {inner}
      </NavLink>
    );
  }

  const {
    type = 'button',
    provider: omitProvider2,
    className: omitClassName2,
    ...buttonRest
  } = props as Extract<LoginButtonProps, { href?: undefined }>;
  void omitProvider2;
  void omitClassName2;
  return (
    <button
      type={type}
      className={surfaceClass}
      data-name="LoginButton"
      {...buttonRest}
    >
      {inner}
    </button>
  );
}
