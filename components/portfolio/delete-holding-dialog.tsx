'use client';

import { useState, useTransition } from 'react';

import type { Holding } from '../../lib/holdings/types';
import { useHoldingsStore } from '../../stores/holdings-store';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

type DeleteHoldingDialogProps = {
  holding: Holding;
};

const resolveHoldingName = (holding: Holding): string => {
  if (holding.stock_name && holding.stock_name.trim().length > 0) {
    return holding.stock_name.trim();
  }

  return holding.stock_code;
};

export function DeleteHoldingDialog({ holding }: DeleteHoldingDialogProps) {
  const deleteHolding = useHoldingsStore((state) => state.deleteHolding);
  const isLoading = useHoldingsStore((state) => state.isLoading);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFormError(null);
    }
    setOpen(nextOpen);
  };

  const handleDelete = () => {
    setFormError(null);
    startTransition(async () => {
      const result = await deleteHolding({ id: holding.id });
      if (!result.ok) {
        setFormError(result.error);
        return;
      }

      handleOpenChange(false);
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => handleOpenChange(true)}
      >
        削除
      </Button>
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>保有銘柄を削除</AlertDialogTitle>
            <AlertDialogDescription>
              {resolveHoldingName(holding)}を削除しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading || isPending}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading || isPending}
            >
              {isLoading || isPending ? '削除中...' : '削除する'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
