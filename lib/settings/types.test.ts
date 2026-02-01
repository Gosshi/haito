import { describe, it, expectTypeOf } from 'vitest';
import type {
  UserSettings,
  UserSettingsResponse,
  UpdateUserSettingsRequest,
  SettingsErrorType,
  SettingsResult,
} from './types';

describe('Settings Types', () => {
  describe('UserSettings', () => {
    it('should have annual_dividend_goal as number | null', () => {
      const settings: UserSettings = {
        annual_dividend_goal: 1500000,
        goal_deadline_year: 2032,
        display_currency: 'JPY',
      };
      expectTypeOf(settings.annual_dividend_goal).toEqualTypeOf<number | null>();
    });

    it('should have goal_deadline_year as number | null', () => {
      const settings: UserSettings = {
        annual_dividend_goal: null,
        goal_deadline_year: null,
        display_currency: 'JPY',
      };
      expectTypeOf(settings.goal_deadline_year).toEqualTypeOf<number | null>();
    });

    it('should have display_currency as string', () => {
      const settings: UserSettings = {
        annual_dividend_goal: null,
        goal_deadline_year: null,
        display_currency: 'USD',
      };
      expectTypeOf(settings.display_currency).toEqualTypeOf<string>();
    });
  });

  describe('UserSettingsResponse', () => {
    it('should be equivalent to UserSettings', () => {
      const response: UserSettingsResponse = {
        annual_dividend_goal: 1000000,
        goal_deadline_year: 2030,
        display_currency: 'JPY',
      };
      expectTypeOf(response).toMatchTypeOf<UserSettings>();
    });
  });

  describe('UpdateUserSettingsRequest', () => {
    it('should have optional annual_dividend_goal', () => {
      const request1: UpdateUserSettingsRequest = {};
      const request2: UpdateUserSettingsRequest = { annual_dividend_goal: 500000 };
      const request3: UpdateUserSettingsRequest = { annual_dividend_goal: null };
      expectTypeOf(request1).toMatchTypeOf<UpdateUserSettingsRequest>();
      expectTypeOf(request2).toMatchTypeOf<UpdateUserSettingsRequest>();
      expectTypeOf(request3).toMatchTypeOf<UpdateUserSettingsRequest>();
    });

    it('should have optional goal_deadline_year', () => {
      const request1: UpdateUserSettingsRequest = {};
      const request2: UpdateUserSettingsRequest = { goal_deadline_year: 2030 };
      const request3: UpdateUserSettingsRequest = { goal_deadline_year: null };
      expectTypeOf(request1).toMatchTypeOf<UpdateUserSettingsRequest>();
      expectTypeOf(request2).toMatchTypeOf<UpdateUserSettingsRequest>();
      expectTypeOf(request3).toMatchTypeOf<UpdateUserSettingsRequest>();
    });
  });

  describe('SettingsErrorType', () => {
    it('should be validation, unauthorized, or unknown', () => {
      const type1: SettingsErrorType = 'validation';
      const type2: SettingsErrorType = 'unauthorized';
      const type3: SettingsErrorType = 'unknown';
      expectTypeOf(type1).toEqualTypeOf<SettingsErrorType>();
      expectTypeOf(type2).toEqualTypeOf<SettingsErrorType>();
      expectTypeOf(type3).toEqualTypeOf<SettingsErrorType>();
    });
  });

  describe('SettingsResult', () => {
    it('should be ok with data when successful', () => {
      const success: SettingsResult<UserSettings> = {
        ok: true,
        data: {
          annual_dividend_goal: 1500000,
          goal_deadline_year: 2032,
          display_currency: 'JPY',
        },
      };
      expectTypeOf(success).toMatchTypeOf<SettingsResult<UserSettings>>();
    });

    it('should be not ok with error when failed', () => {
      const failure: SettingsResult<UserSettings> = {
        ok: false,
        error: {
          type: 'validation',
          message: 'Invalid value',
        },
      };
      expectTypeOf(failure).toMatchTypeOf<SettingsResult<UserSettings>>();
    });
  });
});
