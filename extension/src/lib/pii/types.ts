export type PIIType =
  | "ssn"
  | "tcKimlik"
  | "itin"
  | "email"
  | "phone"
  | "trPhone"
  | "usPhone"
  | "iban"
  | "creditCard"
  | "passport"
  | "names"
  | "address"
  | "dateOfBirth";

export interface PIIMatch {
  type: PIIType;
  value: string;
  startIndex: number;
  endIndex: number;
  pageIndex: number;
  confidence: number;
}

export type RegulationType =
  | "COMPREHENSIVE"
  | "KVKK"
  | "GDPR"
  | "HIPAA"
  | "CCPA"
  | "LGPD"
  | "PIPA"
  | "APPI"
  | "PIPL"
  | "CUSTOM";

export interface RegulationProfile {
  name: RegulationType;
  country: string;
  patterns: PIIType[];
  description: string;
}

export interface PIIDetectionResult {
  matches: PIIMatch[];
  totalCount: number;
  byType: Record<string, number>;
}

export const PII_LABELS: Record<PIIType, string> = {
  ssn: "SSN",
  tcKimlik: "TC Kimlik",
  itin: "ITIN",
  email: "E-posta",
  phone: "Telefon",
  trPhone: "TR Telefon",
  usPhone: "US Telefon",
  iban: "IBAN",
  creditCard: "Kredi Kart\u0131",
  passport: "Pasaport",
  names: "\u0130sim",
  address: "Adres",
  dateOfBirth: "Do\u011fum Tarihi",
};
