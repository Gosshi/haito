import { HoldingsTable } from '../../components/portfolio/holdings-table';
import { Toaster } from '../../components/ui/toaster';
import { LegalFooter } from '../../components/legal/legal-footer';

export default function PortfolioPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">ポートフォリオ</h1>
        <p className="text-sm text-muted-foreground">
          保有銘柄の一覧を確認できます。
        </p>
      </div>
      <HoldingsTable />
      <LegalFooter />
      <Toaster />
    </main>
  );
}
