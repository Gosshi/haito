import type {
  AccountType,
  HoldingEditResult,
  HoldingFieldErrors,
  HoldingUpdate,
} from './types';

const accountTypeValues: AccountType[] = [
  'specific',
  'nisa_growth',
  'nisa_tsumitate',
  'nisa_legacy',
];

const isAccountType = (value: string): value is AccountType =>
  accountTypeValues.includes(value as AccountType);

const normalizeValue = (value: FormDataEntryValue | null): string =>
  typeof value === 'string' ? value.trim() : '';

export const parseHoldingEditForm = (formData: FormData): HoldingEditResult => {
  const sharesInput = normalizeValue(formData.get('shares'));
  const acquisitionPriceInput = normalizeValue(
    formData.get('acquisition_price')
  );
  const accountTypeInput = normalizeValue(formData.get('account_type'));

  const errors: HoldingFieldErrors = {};

  let sharesValue: number | null = null;
  if (!sharesInput) {
    errors.shares = '保有株数は必須です。';
  } else {
    const parsedShares = Number(sharesInput);
    if (!Number.isInteger(parsedShares) || parsedShares <= 0) {
      errors.shares = '保有株数は正の整数で入力してください。';
    } else {
      sharesValue = parsedShares;
    }
  }

  let acquisitionPriceValue: number | null = null;
  if (acquisitionPriceInput) {
    const parsedPrice = Number(acquisitionPriceInput);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      errors.acquisition_price = '取得単価は正の数値で入力してください。';
    } else {
      acquisitionPriceValue = parsedPrice;
    }
  }

  if (!accountTypeInput) {
    errors.account_type = '口座種別は必須です。';
  } else if (!isAccountType(accountTypeInput)) {
    errors.account_type = '口座種別が不正です。';
  }

  if (Object.keys(errors).length > 0 || sharesValue === null) {
    return { errors };
  }

  const value: HoldingUpdate = {
    shares: sharesValue,
    acquisition_price: acquisitionPriceValue,
    account_type: accountTypeInput as AccountType,
  };

  return { errors, value };
};
