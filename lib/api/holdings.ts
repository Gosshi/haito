import { createClient } from '../supabase/client';

import type {
  DeleteHoldingInput,
  Holding,
  NewHolding,
  UpdateHoldingInput,
} from '../holdings/types';

export type HoldingsErrorType = 'duplicate' | 'unauthorized' | 'unknown';

export type HoldingsResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { type: HoldingsErrorType; message: string } };

const DUPLICATE_ERROR_CODE = '23505';

type UserIdResult =
  | { ok: true; userId: string }
  | { ok: false; error: { type: HoldingsErrorType; message: string } };

const getUserId = async (): Promise<UserIdResult> => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = error ? null : data.user;

  if (!user) {
    return {
      ok: false,
      error: { type: 'unauthorized', message: 'Authentication required.' },
    };
  }

  return { ok: true, userId: user.id };
};

export const fetchHoldings = async (): Promise<HoldingsResult<Holding[]>> => {
  const supabase = createClient();
  const userIdResult = await getUserId();

  if (!userIdResult.ok) {
    return { ok: false, error: userIdResult.error };
  }

  const { data, error } = await supabase
    .from('holdings')
    .select(
      'id, user_id, stock_code, stock_name, shares, acquisition_price, account_type, created_at, updated_at'
    )
    .eq('user_id', userIdResult.userId)
    .order('created_at', { ascending: false });

  if (error) {
    return {
      ok: false,
      error: { type: 'unknown', message: error.message },
    };
  }

  return { ok: true, data: (data ?? []) as Holding[] };
};

export const createHolding = async (
  input: NewHolding
): Promise<HoldingsResult<null>> => {
  const supabase = createClient();
  const userIdResult = await getUserId();

  if (!userIdResult.ok) {
    return { ok: false, error: userIdResult.error };
  }

  const stockName = input.stock_name?.trim();
  const payload = {
    user_id: userIdResult.userId,
    stock_code: input.stock_code.trim(),
    stock_name: stockName ? stockName : null,
    shares: input.shares,
    acquisition_price: input.acquisition_price ?? null,
    account_type: input.account_type,
  };

  const { error } = await supabase.from('holdings').insert(payload);

  if (error) {
    if (error.code === DUPLICATE_ERROR_CODE) {
      return {
        ok: false,
        error: {
          type: 'duplicate',
          message: 'This holding already exists.',
        },
      };
    }

    return {
      ok: false,
      error: { type: 'unknown', message: error.message },
    };
  }

  return { ok: true, data: null };
};

export const updateHolding = async (
  input: UpdateHoldingInput
): Promise<HoldingsResult<null>> => {
  const supabase = createClient();
  const userIdResult = await getUserId();

  if (!userIdResult.ok) {
    return { ok: false, error: userIdResult.error };
  }

  const payload = {
    shares: input.shares,
    acquisition_price: input.acquisition_price ?? null,
    account_type: input.account_type,
  };

  const { error } = await supabase
    .from('holdings')
    .update(payload)
    .eq('id', input.id)
    .eq('user_id', userIdResult.userId);

  if (error) {
    if (error.code === DUPLICATE_ERROR_CODE) {
      return {
        ok: false,
        error: {
          type: 'duplicate',
          message: 'This holding already exists.',
        },
      };
    }

    return {
      ok: false,
      error: { type: 'unknown', message: error.message },
    };
  }

  return { ok: true, data: null };
};

export const deleteHolding = async (
  input: DeleteHoldingInput
): Promise<HoldingsResult<null>> => {
  const supabase = createClient();
  const userIdResult = await getUserId();

  if (!userIdResult.ok) {
    return { ok: false, error: userIdResult.error };
  }

  const { error } = await supabase
    .from('holdings')
    .delete()
    .eq('id', input.id)
    .eq('user_id', userIdResult.userId);

  if (error) {
    return {
      ok: false,
      error: { type: 'unknown', message: error.message },
    };
  }

  return { ok: true, data: null };
};
