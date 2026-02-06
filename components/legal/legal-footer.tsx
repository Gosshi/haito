'use client';

import Link from 'next/link';

import { legalLinksService } from '../../lib/legal/links';

const renderLink = (label: string, href: string, external: boolean) => {
  if (external) {
    return (
      <a
        className="text-primary hover:underline"
        href={href}
        rel="noreferrer noopener"
        target="_blank"
      >
        {label}
      </a>
    );
  }

  return (
    <Link className="text-primary hover:underline" href={href}>
      {label}
    </Link>
  );
};

export function LegalFooter() {
  const { terms, privacy, feedback } = legalLinksService.getLinks();

  return (
    <section className="space-y-2 border-t pt-4">
      <div className="flex flex-wrap gap-3 text-sm">
        {renderLink(terms.label, terms.href, terms.external)}
        {renderLink(privacy.label, privacy.href, privacy.external)}
        {renderLink(feedback.label, feedback.href, feedback.external)}
      </div>
      <p className="text-xs text-muted-foreground">
        本サービスは投資助言を目的としたものではありません。表示内容は試算や前提条件に基づくもので、最終判断はご自身で行ってください。
      </p>
    </section>
  );
}
