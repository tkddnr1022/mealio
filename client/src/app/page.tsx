import { redirect } from 'next/navigation';

import { HOME_PATH } from '@/lib/constants/routes.constants';

export default function RootPage() {
  redirect(HOME_PATH);
}
