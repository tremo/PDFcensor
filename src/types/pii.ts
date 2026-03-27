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
  | "dateOfBirth"
  | "face"
  | "ipAddress"
  | "macAddress"
  | "cryptoWallet"
  | "gpsCoordinate"
  | "licensePlate"
  | "nationalId";

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
