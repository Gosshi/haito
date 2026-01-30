import { LogoutButton } from '../../components/auth/logout-button';

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          This is a placeholder dashboard for authenticated users.
        </p>
      </div>
      <LogoutButton />
    </main>
  );
}
