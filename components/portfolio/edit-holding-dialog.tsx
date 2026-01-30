'use client';

import type { FormEvent } from 'react';
import { useState, useTransition } from 'react';

import type {
  AccountType,
  Holding,
  HoldingFieldErrors,
} from '../../lib/holdings/types';
import { parseHoldingEditForm } from '../../lib/holdings/validation';
import { useHoldingsStore } from '../../stores/holdings-store';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectItem } from '../ui/select';

const accountTypeOptions: Array<{ value: AccountType; label: string }> = [
  { value: 'specific', label: '特定口座' },
  { value: 'nisa_growth', label: 'NISA成長投資枠' },
  { value: 'nisa_tsumitate', label: 'NISAつみたて投資枠' },
  { value: 'nisa_legacy', label: '旧NISA' },
];

type EditHoldingDialogProps = {
  holding: Holding;
};

export function EditHoldingDialog({ holding }: EditHoldingDialogProps) {
  const updateHolding = useHoldingsStore((state) => state.updateHolding);
  const isLoading = useHoldingsStore((state) => state.isLoading);
  const [open, setOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<HoldingFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFieldErrors({});
      setFormError(null);
    }
    setOpen(nextOpen);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const { errors, value } = parseHoldingEditForm(formData);

    if (!value) {
      setFieldErrors(errors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      const result = await updateHolding({ id: holding.id, ...value });
      if (!result.ok) {
        const message =
          result.errorType === 'duplicate'
            ? '同じ銘柄が既に登録されています。'
            : result.error;
        setFormError(message);
        return;
      }

      handleOpenChange(false);
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => handleOpenChange(true)}
      >
        編集
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保有銘柄を編集</DialogTitle>
            <DialogDescription>
              登録済みの保有情報を更新できます。
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor={`stock-code-${holding.id}`}>銘柄コード</Label>
              <Input
                id={`stock-code-${holding.id}`}
                value={holding.stock_code}
                readOnly
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`shares-${holding.id}`}>保有株数</Label>
                <Input
                  id={`shares-${holding.id}`}
                  name="shares"
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={holding.shares}
                  aria-invalid={Boolean(fieldErrors.shares)}
                />
                {fieldErrors.shares && (
                  <p className="text-sm text-red-600">{fieldErrors.shares}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`acquisition-price-${holding.id}`}>
                  取得単価（任意）
                </Label>
                <Input
                  id={`acquisition-price-${holding.id}`}
                  name="acquisition_price"
                  type="number"
                  min={0.01}
                  step="0.01"
                  defaultValue={holding.acquisition_price ?? ''}
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
              <Label htmlFor={`account-type-${holding.id}`}>口座種別</Label>
              <Select
                id={`account-type-${holding.id}`}
                name="account_type"
                defaultValue={holding.account_type}
                aria-invalid={Boolean(fieldErrors.account_type)}
              >
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading || isPending}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isLoading || isPending}>
                {isLoading || isPending ? '保存中...' : '保存する'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
