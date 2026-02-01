export interface UserSettings {
  annual_dividend_goal: number | null;
  goal_deadline_year: number | null;
  display_currency: string;
}

export type UserSettingsResponse = UserSettings;

export interface UpdateUserSettingsRequest {
  annual_dividend_goal?: number | null;
  goal_deadline_year?: number | null;
}

export type SettingsErrorType = 'validation' | 'unauthorized' | 'unknown';

export type SettingsResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { type: SettingsErrorType; message: string } };
