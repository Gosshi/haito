import { AddHoldingForm } from '../../../components/portfolio/add-holding-form';

export default function AddHoldingPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">銘柄を追加</h1>
        <p className="text-sm text-muted-foreground">
          必須項目を入力して保有銘柄を登録します。
        </p>
      </div>
      <AddHoldingForm />
    </main>
  );
}
