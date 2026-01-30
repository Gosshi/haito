import { SignupForm } from '../../components/auth/signup-form';

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-muted-foreground">
          Sign up with your email address and a secure password.
        </p>
      </div>
      <SignupForm />
    </main>
  );
}
