'use client';

import { Card, CardContent } from '../ui/card';

export interface ImportSummaryProps {
  totalRows: number;
  validRows: number;
  errorRows: number;
}

export function ImportSummary({
  totalRows,
  validRows,
  errorRows,
}: ImportSummaryProps) {
  const hasErrors = errorRows > 0;

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm">
          全{totalRows}件中、
          <span className="font-medium text-emerald-600">正常{validRows}件</span>
          {hasErrors && (
            <>
              、<span className="font-medium text-red-600">エラー{errorRows}件</span>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
