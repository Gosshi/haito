import packageJson from '../../package.json';

export type LegalLink = {
  key: 'terms' | 'privacy' | 'feedback';
  label: string;
  href: string;
  external: boolean;
};

export type LegalLinks = {
  terms: LegalLink;
  privacy: LegalLink;
  feedback: LegalLink;
};

export interface LegalLinksService {
  getLinks(): LegalLinks;
}

const isExternalUrl = (value: string): boolean => /^https?:\/\//.test(value);
const isInternalPath = (value: string): boolean => value.startsWith('/');

const normalizeUrl = (value: string | undefined, fallback: string): string => {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  if (isExternalUrl(trimmed) || isInternalPath(trimmed)) {
    return trimmed;
  }

  return fallback;
};

const defaultFeedbackUrl =
  packageJson?.bugs?.url ?? 'https://github.com/Gosshi/haito/issues';

export const legalLinksService: LegalLinksService = {
  getLinks() {
    const termsHref = normalizeUrl(
      process.env.NEXT_PUBLIC_TERMS_URL,
      '/terms'
    );
    const privacyHref = normalizeUrl(
      process.env.NEXT_PUBLIC_PRIVACY_URL,
      '/privacy'
    );
    const feedbackHref = normalizeUrl(
      process.env.NEXT_PUBLIC_FEEDBACK_URL,
      defaultFeedbackUrl
    );

    return {
      terms: {
        key: 'terms',
        label: '利用規約',
        href: termsHref,
        external: isExternalUrl(termsHref),
      },
      privacy: {
        key: 'privacy',
        label: 'プライバシーポリシー',
        href: privacyHref,
        external: isExternalUrl(privacyHref),
      },
      feedback: {
        key: 'feedback',
        label: 'フィードバック',
        href: feedbackHref,
        external: isExternalUrl(feedbackHref),
      },
    };
  },
};
