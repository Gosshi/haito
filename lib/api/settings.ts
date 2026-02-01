import type {
  UserSettings,
  UpdateUserSettingsRequest,
  SettingsResult,
} from '../settings/types';

export const getUserSettings = async (): Promise<UserSettings> => {
  const response = await fetch('/api/settings', { method: 'GET' });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }

  const result = (await response.json()) as SettingsResult<UserSettings>;

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.data;
};

export const updateUserSettings = async (
  data: UpdateUserSettingsRequest
): Promise<UserSettings> => {
  const response = await fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }

  const result = (await response.json()) as SettingsResult<UserSettings>;

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.data;
};
