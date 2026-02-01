import { NextResponse } from 'next/server';

import { createClient } from '../../../lib/supabase/server';
import type {
  UserSettings,
  UpdateUserSettingsRequest,
  SettingsResult,
  SettingsErrorType,
} from '../../../lib/settings/types';

type ErrorResult = {
  ok: false;
  error: { type: SettingsErrorType; message: string };
};

const buildErrorResponse = (
  type: SettingsErrorType,
  message: string
): ErrorResult => ({
  ok: false,
  error: { type, message },
});

const getCurrentYear = (): number => new Date().getFullYear();

export async function GET(
  _request: Request
): Promise<NextResponse<SettingsResult<UserSettings>>> {
  const supabase = createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  const user = authError ? null : data.user;

  if (!user) {
    return NextResponse.json(
      buildErrorResponse('unauthorized', 'Authentication required'),
      { status: 401 }
    );
  }

  // 既存の設定を取得
  const { data: settings, error: selectError } = await supabase
    .from('user_settings')
    .select('annual_dividend_goal, goal_deadline_year, display_currency')
    .eq('user_id', user.id)
    .single();

  // 設定が存在する場合はそのまま返す
  if (settings && !selectError) {
    return NextResponse.json({
      ok: true,
      data: {
        annual_dividend_goal: settings.annual_dividend_goal ?? null,
        goal_deadline_year: settings.goal_deadline_year ?? null,
        display_currency: settings.display_currency ?? 'JPY',
      },
    });
  }

  // 設定が存在しない場合はupsertでデフォルト値を作成
  const { data: upsertedSettings, error: upsertError } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: user.id,
        annual_dividend_goal: null,
        goal_deadline_year: null,
        display_currency: 'JPY',
      },
      { onConflict: 'user_id' }
    )
    .select('annual_dividend_goal, goal_deadline_year, display_currency')
    .single();

  if (upsertError || !upsertedSettings) {
    return NextResponse.json(
      buildErrorResponse('unknown', 'Failed to create default settings'),
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      annual_dividend_goal: upsertedSettings.annual_dividend_goal ?? null,
      goal_deadline_year: upsertedSettings.goal_deadline_year ?? null,
      display_currency: upsertedSettings.display_currency ?? 'JPY',
    },
  });
}

export async function PATCH(
  request: Request
): Promise<NextResponse<SettingsResult<UserSettings>>> {
  const supabase = createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  const user = authError ? null : data.user;

  if (!user) {
    return NextResponse.json(
      buildErrorResponse('unauthorized', 'Authentication required'),
      { status: 401 }
    );
  }

  // リクエストボディのパース
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      buildErrorResponse('validation', 'Invalid JSON body'),
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      buildErrorResponse('validation', 'Request body must be an object'),
      { status: 400 }
    );
  }

  const requestBody = body as Partial<UpdateUserSettingsRequest>;

  // バリデーション
  if (
    requestBody.annual_dividend_goal !== undefined &&
    requestBody.annual_dividend_goal !== null &&
    requestBody.annual_dividend_goal < 0
  ) {
    return NextResponse.json(
      buildErrorResponse(
        'validation',
        'annual_dividend_goal must be 0 or greater'
      ),
      { status: 400 }
    );
  }

  if (
    requestBody.goal_deadline_year !== undefined &&
    requestBody.goal_deadline_year !== null &&
    requestBody.goal_deadline_year < getCurrentYear()
  ) {
    return NextResponse.json(
      buildErrorResponse(
        'validation',
        'goal_deadline_year must be current year or later'
      ),
      { status: 400 }
    );
  }

  // 更新するフィールドを構築
  const updatePayload: Record<string, number | null> = {};

  if (requestBody.annual_dividend_goal !== undefined) {
    updatePayload.annual_dividend_goal = requestBody.annual_dividend_goal;
  }

  if (requestBody.goal_deadline_year !== undefined) {
    updatePayload.goal_deadline_year = requestBody.goal_deadline_year;
  }

  // 更新実行
  const { data: updatedSettings, error: updateError } = await supabase
    .from('user_settings')
    .update(updatePayload)
    .eq('user_id', user.id)
    .select('annual_dividend_goal, goal_deadline_year, display_currency')
    .single();

  if (updateError || !updatedSettings) {
    return NextResponse.json(
      buildErrorResponse('unknown', 'Failed to update settings'),
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      annual_dividend_goal: updatedSettings.annual_dividend_goal ?? null,
      goal_deadline_year: updatedSettings.goal_deadline_year ?? null,
      display_currency: updatedSettings.display_currency ?? 'JPY',
    },
  });
}
