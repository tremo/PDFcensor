import type { RegulationProfile, RegulationType, PIIType } from "@/types/pii";
import type { Locale } from "@/lib/i18n/config";

export const regulations: Record<RegulationType, RegulationProfile> = {
  COMPREHENSIVE: {
    name: "COMPREHENSIVE",
    country: "ALL",
    patterns: [
      "ssn", "itin", "tcKimlik", "email", "phone", "trPhone", "usPhone",
      "iban", "creditCard", "passport", "names", "address",
    ],
    description: "Comprehensive — US + EU + TR (Recommended)",
  },
  KVKK: {
    name: "KVKK",
    country: "TR",
    patterns: ["tcKimlik", "trPhone", "email", "iban", "names", "address"],
    description: "Kişisel Verilerin Korunması Kanunu (Turkey)",
  },
  GDPR: {
    name: "GDPR",
    country: "EU",
    patterns: ["email", "phone", "iban", "names", "address", "passport"],
    description: "General Data Protection Regulation (EU)",
  },
  HIPAA: {
    name: "HIPAA",
    country: "US",
    patterns: ["ssn", "names", "email", "usPhone", "address"],
    description: "Health Insurance Portability and Accountability Act (US)",
  },
  CCPA: {
    name: "CCPA",
    country: "US",
    patterns: ["ssn", "itin", "email", "usPhone", "creditCard", "names"],
    description: "California Consumer Privacy Act (US)",
  },
  LGPD: {
    name: "LGPD",
    country: "BR",
    patterns: ["email", "phone", "names", "address"],
    description: "Lei Geral de Proteção de Dados (Brazil)",
  },
  PIPA: {
    name: "PIPA",
    country: "KR",
    patterns: ["email", "phone", "names"],
    description: "Personal Information Protection Act (South Korea)",
  },
  APPI: {
    name: "APPI",
    country: "JP",
    patterns: ["email", "phone", "names"],
    description: "Act on Protection of Personal Information (Japan)",
  },
  PIPL: {
    name: "PIPL",
    country: "CN",
    patterns: ["email", "phone", "names"],
    description: "Personal Information Protection Law (China)",
  },
  CUSTOM: {
    name: "CUSTOM",
    country: "ALL",
    patterns: [
      "ssn", "tcKimlik", "itin", "email", "phone", "trPhone", "usPhone",
      "iban", "creditCard", "passport", "names", "address",
    ],
    description: "All available PII patterns",
  },
};

/**
 * Get the default regulation based on locale.
 */
export function getDefaultRegulation(locale: Locale): RegulationType {
  const mapping: Record<string, RegulationType> = {
    tr: "COMPREHENSIVE",
    en: "COMPREHENSIVE",
    de: "COMPREHENSIVE",
    fr: "COMPREHENSIVE",
    es: "COMPREHENSIVE",
    pt: "COMPREHENSIVE",
    ja: "COMPREHENSIVE",
    ko: "COMPREHENSIVE",
    zh: "COMPREHENSIVE",
  };
  return mapping[locale] || "COMPREHENSIVE";
}

/**
 * Get PIITypes for a given regulation.
 */
export function getRegulationPatterns(regulation: RegulationType): PIIType[] {
  return regulations[regulation]?.patterns || regulations.CUSTOM.patterns;
}

/**
 * All 24 official EU language locales.
 * Used for GDPR to load name dictionaries for every EU member state language.
 */
const EU_LOCALES = [
  "bg", "hr", "cs", "da", "nl", "en", "et", "fi", "fr", "de",
  "el", "hu", "ga", "it", "lv", "lt", "mt", "pl", "pt", "ro",
  "sk", "sl", "es", "sv",
];

/**
 * Get the locales whose name dictionaries should be loaded for a given
 * regulation + UI locale combination.
 *
 * For GDPR → all 24 EU languages (a French PDF processed in English UI
 *   still needs French names detected).
 * For KVKK → Turkish.
 * For COMPREHENSIVE / CUSTOM → all available (EU + TR + UI locale).
 * For region-specific (HIPAA, CCPA) → English + Spanish (US demographics).
 * Always includes the current UI locale as a fallback.
 */
export function getRegulationLocales(
  regulation: RegulationType,
  uiLocale: string
): string[] {
  const unique = (arr: string[]) => [...new Set(arr)];

  switch (regulation) {
    case "GDPR":
      return unique([...EU_LOCALES, uiLocale]);
    case "KVKK":
      return unique(["tr", uiLocale]);
    case "HIPAA":
    case "CCPA":
      return unique(["en", "es", uiLocale]);
    case "LGPD":
      return unique(["pt", uiLocale]);
    case "PIPA":
      return unique(["ko", "en", uiLocale]);
    case "APPI":
      return unique(["ja", "en", uiLocale]);
    case "PIPL":
      return unique(["zh", "en", uiLocale]);
    case "COMPREHENSIVE":
    case "CUSTOM":
      return unique([...EU_LOCALES, "tr", uiLocale]);
    default:
      return [uiLocale];
  }
}
