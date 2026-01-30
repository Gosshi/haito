export type AuthInput = {
  email: string;
  password: string;
  passwordConfirm?: string;
};

export type AuthFieldErrors = Record<string, string>;

export type AuthResult =
  | { ok: true; redirectTo?: '/dashboard' | '/login' }
  | { ok: false; fieldErrors?: AuthFieldErrors; formError?: string };

export type AuthAction = (input: AuthInput) => Promise<AuthResult>;
