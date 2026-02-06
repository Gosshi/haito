export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">プライバシーポリシー</h1>
        <p className="text-sm text-muted-foreground">
          本サービスにおける個人情報の取扱い方針を示します。
        </p>
      </div>

      <section className="space-y-3 text-sm text-muted-foreground">
        <p>
          本サービスでは、ログイン情報や設定情報など、ユーザーが入力した情報を利用して機能を提供します。
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>取得する情報は、サービス提供に必要な範囲に限定します。</li>
          <li>取得した情報は、利用目的の範囲内で適切に取り扱います。</li>
          <li>法令に基づく場合を除き、第三者への提供は行いません。</li>
        </ul>
        <p>
          お問い合わせやフィードバックは、アプリ内の導線からご連絡ください。
        </p>
      </section>
    </main>
  );
}
