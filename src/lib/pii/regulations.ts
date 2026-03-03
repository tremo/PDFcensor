import type { RegulationProfile, RegulationType, PIIType } from "@/types/pii";
import type { Locale } from "@/lib/i18n/config";

export const regulations: Record<RegulationType, RegulationProfile> = {
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
    tr: "KVKK",
    en: "HIPAA",
    de: "GDPR",
    fr: "GDPR",
    es: "GDPR",
    pt: "LGPD",
    ja: "APPI",
    ko: "PIPA",
    zh: "PIPL",
  };
  return mapping[locale] || "GDPR";
}

/**
 * Get PIITypes for a given regulation.
 */
export function getRegulationPatterns(regulation: RegulationType): PIIType[] {
  return regulations[regulation]?.patterns || regulations.CUSTOM.patterns;
}
