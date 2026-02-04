import Link from 'next/link';

import { getFeatureLabel, type FeatureKey } from '../../lib/access/feature-catalog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

type PremiumLockBannerProps = {
  feature: FeatureKey;
};

export function PremiumLockBanner({ feature }: PremiumLockBannerProps) {
  const label = getFeatureLabel(feature);

  return (
    <Card>
      <CardContent className="space-y-3 py-6">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            有料
          </span>
          <p className="text-sm font-semibold text-foreground">{label}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          この機能は有料プランで利用できます。
        </p>
        <Link href="/billing" className="inline-flex">
          <Button variant="outline" size="sm">
            有料プランを見る
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
