export default function TermsPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">利用規約</h1>
        <p className="text-sm text-muted-foreground">
          本サービスをご利用いただく際の基本的な条件を定めます。
        </p>
      </div>

      <section className="space-y-3 text-sm text-muted-foreground">
        <p>
          本サービスは、配当の試算や記録の整理を補助するための情報提供を目的としています。
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>入力内容の正確性はご自身でご確認ください。</li>
          <li>本サービスの内容は予告なく変更・停止される場合があります。</li>
          <li>法令に反する利用、公序良俗に反する利用は禁止します。</li>
        </ul>
        <p>
          ご利用に伴って発生した損害について、当方は合理的な範囲を超える責任を負いません。
        </p>
      </section>
    </main>
  );
}
