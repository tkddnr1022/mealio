import { LoginClientPage } from '@/app/(auth)/login/LoginClientPage';
import { NEXT_QUERY_PARAM } from '@/lib/auth/routes';
import {
  getSingleSearchParam,
  resolveSearchParams,
  type SearchParamRecord,
} from '@/lib/utils/search-params';

interface LoginPageProps {
  searchParams?: Promise<SearchParamRecord>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await resolveSearchParams(searchParams);
  const oauthNext = getSingleSearchParam(resolvedSearchParams?.[NEXT_QUERY_PARAM]) ?? null;
  return <LoginClientPage oauthNext={oauthNext} />;
}
