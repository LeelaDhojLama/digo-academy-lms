import { LoginForm } from '@/features/auth/components/LoginForm';
import { isGoogleAuthEnabled } from '@/lib/env';
import { Panel } from '@/shared/components/dashboard/Panel';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <Panel className="p-8 shadow-lg">
      <div className="mb-6 space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your Digo Academy account.</p>
      </div>
      <LoginForm googleEnabled={isGoogleAuthEnabled} redirectTo={redirectTo ?? '/dashboard'} />
    </Panel>
  );
}
