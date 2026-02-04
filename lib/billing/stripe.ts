import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';

type StripeEvent = {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

type CheckoutSessionInput = {
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
};

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const SIGNATURE_TOLERANCE_SECONDS = 300;

const getStripeSecretKey = (): string => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Missing Stripe secret key');
  }
  return key;
};

const getStripeWebhookSecret = (): string => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Missing Stripe webhook secret');
  }
  return secret;
};

const parseStripeSignature = (
  signature: string
): { timestamp: string; signature: string } => {
  const parts = signature.split(',');
  const timestampPart = parts.find((part) => part.startsWith('t='));
  const signaturePart = parts.find((part) => part.startsWith('v1='));

  if (!timestampPart || !signaturePart) {
    throw new Error('Invalid Stripe signature header');
  }

  const timestamp = timestampPart.split('=')[1];
  const signed = signaturePart.split('=')[1];

  if (!timestamp || !signed) {
    throw new Error('Invalid Stripe signature header');
  }

  return { timestamp, signature: signed };
};

const verifySignature = (payload: string, signatureHeader: string): void => {
  const { timestamp, signature } = parseStripeSignature(signatureHeader);

  const timestampValue = Number(timestamp);
  if (!Number.isFinite(timestampValue)) {
    throw new Error('Invalid Stripe signature timestamp');
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampValue) > SIGNATURE_TOLERANCE_SECONDS) {
    throw new Error('Stripe signature timestamp out of tolerance');
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = createHmac(
    'sha256',
    getStripeWebhookSecret()
  )
    .update(signedPayload, 'utf8')
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    throw new Error('Stripe signature verification failed');
  }
};

export const createCheckoutSession = async (
  input: CheckoutSessionInput
): Promise<string> => {
  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('success_url', input.successUrl);
  params.append('cancel_url', input.cancelUrl);
  params.append('client_reference_id', input.userId);
  params.append('metadata[user_id]', input.userId);
  params.append('line_items[0][price]', input.priceId);
  params.append('line_items[0][quantity]', '1');

  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Stripe request failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { url?: string };

  if (!data.url) {
    throw new Error('Checkout URL is missing');
  }

  return data.url;
};

export const constructStripeEvent = (
  payload: string,
  signature: string | null
): StripeEvent => {
  if (!signature) {
    throw new Error('Missing Stripe signature');
  }

  verifySignature(payload, signature);

  return JSON.parse(payload) as StripeEvent;
};
