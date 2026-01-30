import { LoginForm } from '../../components/auth/login-form';

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Log in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and password to access your account.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
