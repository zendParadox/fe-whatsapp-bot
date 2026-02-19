/**
 * Phone normalization and currency utilities
 * Supports: Indonesia (62/IDR) and Australia (61/AUD)
 */

const ALLOWED_COUNTRY_CODES = ["62", "61"] as const;

type CountryCode = (typeof ALLOWED_COUNTRY_CODES)[number];

interface CountryConfig {
  code: CountryCode;
  currency: string;
  currencySymbol: string;
  locale: string;
  name: string;
}

const COUNTRY_MAP: Record<CountryCode, CountryConfig> = {
  "62": {
    code: "62",
    currency: "IDR",
    currencySymbol: "Rp",
    locale: "id-ID",
    name: "Indonesia",
  },
  "61": {
    code: "61",
    currency: "AUD",
    currencySymbol: "A$",
    locale: "en-AU",
    name: "Australia",
  },
};

/**
 * Normalize a phone number input.
 * - Strips non-digit characters (except leading +)
 * - Converts Indonesian local format (0xxx → 62xxx)
 * - Does NOT force any country code on unknown numbers
 */
export function normalizePhone(raw: string): string {
  let cleaned = raw;

  // Remove @xxx suffix (e.g. from WhatsApp JID)
  if (cleaned.includes("@")) {
    cleaned = cleaned.split("@")[0];
  }

  // Remove device identifier (e.g. 628xxx:1 → 628xxx)
  if (cleaned.includes(":")) {
    cleaned = cleaned.split(":")[0];
  }

  // Remove all non-digit characters
  cleaned = cleaned.replace(/\D/g, "");

  // Convert Indonesian local format: 08xxx → 628xxx
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Check if a phone number starts with an allowed country code (62 or 61)
 */
export function isAllowedPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return ALLOWED_COUNTRY_CODES.some((code) => normalized.startsWith(code));
}

/**
 * Get country code from a normalized phone number
 */
export function getCountryCode(phone: string): CountryCode | null {
  const normalized = normalizePhone(phone);
  for (const code of ALLOWED_COUNTRY_CODES) {
    if (normalized.startsWith(code)) {
      return code;
    }
  }
  return null;
}

/**
 * Get currency code from a phone number (auto-detect)
 * @returns "IDR" | "AUD" | "IDR" (default)
 */
export function getCurrencyFromPhone(phone: string): string {
  const code = getCountryCode(phone);
  if (code && COUNTRY_MAP[code]) {
    return COUNTRY_MAP[code].currency;
  }
  return "IDR"; // default
}

/**
 * Get country config from currency code
 */
export function getCountryFromCurrency(currency: string): CountryConfig {
  for (const config of Object.values(COUNTRY_MAP)) {
    if (config.currency === currency) {
      return config;
    }
  }
  return COUNTRY_MAP["62"]; // default to Indonesia
}

/**
 * Format money for display in dashboard/web (with full locale formatting)
 */
export function formatMoney(amount: number, currency: string = "IDR"): string {
  const config = getCountryFromCurrency(currency);
  if (currency === "IDR") {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  }
  if (currency === "AUD") {
    return `A$ ${amount.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${config.currencySymbol} ${amount.toLocaleString(config.locale)}`;
}

/**
 * Format money for WhatsApp bot responses
 */
export function formatMoneyBot(
  amount: number,
  currency: string = "IDR"
): string {
  return formatMoney(amount, currency);
}
