import { LoginClientPage } from '@/app/(auth)/login/LoginClientPage';
import { NEXT_QUERY_PARAM } from '@/lib/auth/routes';

interface LoginPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

const normalizeSearchParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function LoginPage({ searchParams }: LoginPageProps) {
  const oauthNext = normalizeSearchParam(searchParams?.[NEXT_QUERY_PARAM]) ?? null;
  return <LoginClientPage oauthNext={oauthNext} />;
}
