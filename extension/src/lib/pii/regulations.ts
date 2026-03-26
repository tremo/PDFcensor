import type { RegulationProfile, RegulationType, PIIType } from "./types";

export const regulations: Record<RegulationType, RegulationProfile> = {
  COMPREHENSIVE: { name: "COMPREHENSIVE", country: "ALL", patterns: ["ssn","itin","tcKimlik","email","phone","trPhone","usPhone","iban","creditCard","passport","names","address","dateOfBirth"], description: "Comprehensive \u2014 US + EU + TR (Recommended)" },
  KVKK: { name: "KVKK", country: "TR", patterns: ["tcKimlik","trPhone","email","iban","names","address","dateOfBirth"], description: "Ki\u015fisel Verilerin Korunmas\u0131 Kanunu (Turkey)" },
  GDPR: { name: "GDPR", country: "EU", patterns: ["email","phone","iban","names","address","passport","dateOfBirth"], description: "General Data Protection Regulation (EU)" },
  HIPAA: { name: "HIPAA", country: "US", patterns: ["ssn","names","email","usPhone","address","dateOfBirth"], description: "Health Insurance Portability and Accountability Act (US)" },
  CCPA: { name: "CCPA", country: "US", patterns: ["ssn","itin","email","usPhone","creditCard","names","dateOfBirth"], description: "California Consumer Privacy Act (US)" },
  LGPD: { name: "LGPD", country: "BR", patterns: ["email","phone","names","address","dateOfBirth"], description: "Lei Geral de Prote\u00e7\u00e3o de Dados (Brazil)" },
  PIPA: { name: "PIPA", country: "KR", patterns: ["email","phone","names","dateOfBirth"], description: "Personal Information Protection Act (South Korea)" },
  APPI: { name: "APPI", country: "JP", patterns: ["email","phone","names","dateOfBirth"], description: "Act on Protection of Personal Information (Japan)" },
  PIPL: { name: "PIPL", country: "CN", patterns: ["email","phone","names","dateOfBirth"], description: "Personal Information Protection Law (China)" },
  CUSTOM: { name: "CUSTOM", country: "ALL", patterns: ["ssn","tcKimlik","itin","email","phone","trPhone","usPhone","iban","creditCard","passport","names","address","dateOfBirth"], description: "All available PII patterns" },
};

export function getRegulationPatterns(regulation: RegulationType): PIIType[] {
  return regulations[regulation]?.patterns || regulations.CUSTOM.patterns;
}

const EU_LOCALES = ["bg","hr","cs","da","nl","en","et","fi","fr","de","el","hu","ga","it","lv","lt","mt","pl","pt","ro","sk","sl","es","sv"];

export function getRegulationLocales(regulation: RegulationType, uiLocale: string): string[] {
  const unique = (arr: string[]) => [...new Set(arr)];
  switch (regulation) {
    case "GDPR": return unique([...EU_LOCALES, uiLocale]);
    case "KVKK": return unique(["tr", uiLocale]);
    case "HIPAA": case "CCPA": return unique(["en", "es", uiLocale]);
    case "LGPD": return unique(["pt", uiLocale]);
    case "PIPA": return unique(["ko", "en", uiLocale]);
    case "APPI": return unique(["ja", "en", uiLocale]);
    case "PIPL": return unique(["zh", "en", uiLocale]);
    case "COMPREHENSIVE": case "CUSTOM": return unique([...EU_LOCALES, "tr", uiLocale]);
    default: return [uiLocale];
  }
}
