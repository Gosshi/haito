'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState, useTransition } from 'react';

import type { AccountType, NewHolding } from '../../lib/holdings/types';
import { useHoldingsStore } from '../../stores/holdings-store';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectItem } from '../ui/select';

const accountTypeOptions: Array<{ value: AccountType; label: string }> = [
  { value: 'specific', label: '特定口座' },
  { value: 'nisa_growth', label: 'NISA成長投資枠' },
  { value: 'nisa_tsumitate', label: 'NISAつみたて投資枠' },
  { value: 'nisa_legacy', label: '旧NISA' },
];

const accountTypeValues = accountTypeOptions.map((option) => option.value);

type FieldErrors = {
  stock_code?: string;
  stock_name?: string;
  shares?: string;
  acquisition_price?: string;
  account_type?: string;
};

type ParsedHoldingForm = {
  errors: FieldErrors;
  value?: NewHolding;
};

const isAccountType = (value: string): value is AccountType =>
  accountTypeValues.includes(value as AccountType);

const normalizeValue = (value: FormDataEntryValue | null): string =>
  typeof value === 'string' ? value.trim() : '';

const parseHoldingForm = (formData: FormData): ParsedHoldingForm => {
  const stockCode = normalizeValue(formData.get('stock_code'));
  const stockName = normalizeValue(formData.get('stock_name'));
  const sharesInput = normalizeValue(formData.get('shares'));
  const acquisitionPriceInput = normalizeValue(
    formData.get('acquisition_price')
  );
  const accountTypeInput = normalizeValue(formData.get('account_type'));

  const errors: FieldErrors = {};

  if (!stockCode) {
    errors.stock_code = '銘柄コードは必須です。';
  } else if (!/^\d{4}$/.test(stockCode)) {
    errors.stock_code = '銘柄コードは4桁の数字で入力してください。';
  }

  let sharesValue: number | null = null;
  if (!sharesInput) {
    errors.shares = '保有株数は必須です。';
  } else {
    const parsedShares = Number(sharesInput);
    if (!Number.isInteger(parsedShares) || parsedShares <= 0) {
      errors.shares = '保有株数は正の整数で入力してください。';
    } else {
      sharesValue = parsedShares;
    }
  }

  let acquisitionPriceValue: number | null = null;
  if (acquisitionPriceInput) {
    const parsedPrice = Number(acquisitionPriceInput);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      errors.acquisition_price = '取得単価は正の数値で入力してください。';
    } else {
      acquisitionPriceValue = parsedPrice;
    }
  }

  if (!accountTypeInput) {
    errors.account_type = '口座種別は必須です。';
  } else if (!isAccountType(accountTypeInput)) {
    errors.account_type = '口座種別が不正です。';
  }

  if (Object.keys(errors).length > 0 || sharesValue === null) {
    return { errors };
  }

  const payload: NewHolding = {
    stock_code: stockCode,
    stock_name: stockName ? stockName : undefined,
    shares: sharesValue,
    acquisition_price: acquisitionPriceValue,
    account_type: accountTypeInput as AccountType,
  };

  return { errors, value: payload };
};

export function AddHoldingForm() {
  const router = useRouter();
  const addHolding = useHoldingsStore((state) => state.addHolding);
  const isLoading = useHoldingsStore((state) => state.isLoading);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const { errors, value } = parseHoldingForm(formData);

    if (!value) {
      setFieldErrors(errors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      const result = await addHolding(value);

      if (!result.ok) {
        const message =
          result.errorType === 'duplicate'
            ? '同じ銘柄が既に登録されています。'
            : result.error;
        setFormError(message);
        return;
      }

      router.push('/portfolio');
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>銘柄情報</CardTitle>
        <CardDescription>
          銘柄コードと保有情報を入力してください。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="stock-code">銘柄コード（4桁）</Label>
            <Input
              id="stock-code"
              name="stock_code"
              inputMode="numeric"
              maxLength={4}
              aria-invalid={Boolean(fieldErrors.stock_code)}
            />
            {fieldErrors.stock_code && (
              <p className="text-sm text-red-600">{fieldErrors.stock_code}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock-name">銘柄名</Label>
            <Input
              id="stock-name"
              name="stock_name"
              aria-invalid={Boolean(fieldErrors.stock_name)}
            />
            {fieldErrors.stock_name && (
              <p className="text-sm text-red-600">{fieldErrors.stock_name}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shares">保有株数</Label>
              <Input
                id="shares"
                name="shares"
                type="number"
                min={1}
                step={1}
                aria-invalid={Boolean(fieldErrors.shares)}
              />
              {fieldErrors.shares && (
                <p className="text-sm text-red-600">{fieldErrors.shares}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisition-price">取得単価（任意）</Label>
              <Input
                id="acquisition-price"
                name="acquisition_price"
                type="number"
                min={0.01}
                step="0.01"
                aria-invalid={Boolean(fieldErrors.acquisition_price)}
              />
              {fieldErrors.acquisition_price && (
                <p className="text-sm text-red-600">
                  {fieldErrors.acquisition_price}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-type">口座種別</Label>
            <Select
              id="account-type"
              name="account_type"
              defaultValue=""
              aria-invalid={Boolean(fieldErrors.account_type)}
            >
              <SelectItem value="" disabled>
                選択してください
              </SelectItem>
              {accountTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
            {fieldErrors.account_type && (
              <p className="text-sm text-red-600">
                {fieldErrors.account_type}
              </p>
            )}
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isLoading || isPending}>
              {isLoading || isPending ? '登録中...' : '登録する'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/portfolio')}
            >
              戻る
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
