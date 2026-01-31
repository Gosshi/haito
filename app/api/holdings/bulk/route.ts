import { NextResponse } from 'next/server';

import { createClient } from '../../../../lib/supabase/server';
import type {
  BulkImportRequest,
  BulkImportResponse,
  DuplicateStrategy,
} from '../../../../lib/api/holdings-bulk';
import { bulkImportHoldings } from '../../../../lib/api/holdings-bulk';

type ErrorResponse = {
  success: false;
  imported: 0;
  skipped: 0;
  errors: [];
  error: {
    type: string;
    message: string;
  };
};

const buildErrorResponse = (
  type: string,
  message: string
): ErrorResponse => ({
  success: false,
  imported: 0,
  skipped: 0,
  errors: [],
  error: { type, message },
});

const isValidDuplicateStrategy = (value: unknown): value is DuplicateStrategy =>
  value === 'skip' || value === 'overwrite';

export async function POST(request: Request): Promise<NextResponse> {
  // 認証チェック
  const supabase = createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  const user = authError ? null : data.user;

  if (!user) {
    return NextResponse.json(
      buildErrorResponse('unauthorized', 'Authentication required.'),
      { status: 401 }
    );
  }

  // リクエストボディのパース
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      buildErrorResponse('validation', 'Invalid JSON body.'),
      { status: 400 }
    );
  }

  // バリデーション
  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      buildErrorResponse('validation', 'Request body must be an object.'),
      { status: 400 }
    );
  }

  const requestBody = body as Partial<BulkImportRequest>;

  // holdings配列のバリデーション
  if (!Array.isArray(requestBody.holdings)) {
    return NextResponse.json(
      buildErrorResponse('validation', 'holdings must be an array.'),
      { status: 400 }
    );
  }

  if (requestBody.holdings.length === 0) {
    return NextResponse.json(
      buildErrorResponse('validation', 'holdings array must not be empty.'),
      { status: 400 }
    );
  }

  // duplicateStrategyのバリデーション
  if (!requestBody.duplicateStrategy) {
    return NextResponse.json(
      buildErrorResponse('validation', 'duplicateStrategy is required.'),
      { status: 400 }
    );
  }

  if (!isValidDuplicateStrategy(requestBody.duplicateStrategy)) {
    return NextResponse.json(
      buildErrorResponse(
        'validation',
        'duplicateStrategy must be "skip" or "overwrite".'
      ),
      { status: 400 }
    );
  }

  // サービス層呼び出し
  const result = await bulkImportHoldings(
    supabase,
    user.id,
    requestBody.holdings,
    requestBody.duplicateStrategy
  );

  // レスポンス変換
  if (!result.ok) {
    const statusCode = result.error.type === 'database' ? 500 : 400;
    return NextResponse.json(
      buildErrorResponse(result.error.type, result.error.message),
      { status: statusCode }
    );
  }

  const response: BulkImportResponse = {
    success: true,
    imported: result.imported,
    skipped: result.skipped,
    errors: result.errors,
  };

  return NextResponse.json(response);
}
