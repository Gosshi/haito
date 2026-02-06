'use client';

import { useState } from 'react';

import { getFeatureLabel, type FeatureKey } from '../../lib/access/feature-catalog';
import {
  PAYWALL_LOCK_COPY,
  PAYWALL_PLAN_VALUE_ITEMS,
  PAYWALL_PRICE,
} from '../../lib/paywall/copy';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

type PremiumLockBannerProps = {
  feature?: FeatureKey;
  contextLabel?: string;
};

const formatJPY = (value: number): string => value.toLocaleString('ja-JP');

export function PremiumLockBanner({ feature, contextLabel }: PremiumLockBannerProps) {
  const [open, setOpen] = useState(false);
  const label = contextLabel ?? (feature ? getFeatureLabel(feature) : 'Pro限定機能');

  return (
    <>
      <Card>
        <CardContent className="space-y-3 py-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              Pro
            </span>
            <p className="text-sm font-semibold text-foreground">{label}</p>
          </div>
          <p className="text-base font-semibold text-foreground">{PAYWALL_LOCK_COPY.title}</p>
          <p className="text-sm text-muted-foreground">{PAYWALL_LOCK_COPY.description}</p>
          <p className="text-xs text-muted-foreground">{PAYWALL_LOCK_COPY.caution}</p>
          <Button variant="outline" size="sm" type="button" onClick={() => setOpen(true)}>
            {PAYWALL_LOCK_COPY.ctaLabel}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>FreeとProの違い</DialogTitle>
            <DialogDescription>
              必要な差分だけを1画面で確認できます。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {PAYWALL_PLAN_VALUE_ITEMS.map((item) => (
              <div key={item.feature} className="rounded-md border p-3 text-sm">
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-muted-foreground">Free: {item.freeValue}</p>
                <p className="text-muted-foreground">Pro: {item.proValue}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1 rounded-md border border-dashed p-3 text-sm">
            <p className="font-medium text-foreground">価格（定数表示）</p>
            <p className="text-muted-foreground">月額 {formatJPY(PAYWALL_PRICE.monthly_jpy)}円</p>
            <p className="text-muted-foreground">年額 {formatJPY(PAYWALL_PRICE.yearly_jpy)}円</p>
          </div>

          <p className="text-xs text-muted-foreground">{PAYWALL_LOCK_COPY.caution}</p>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
