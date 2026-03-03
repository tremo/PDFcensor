import { v4 as uuidv4 } from "uuid";

/**
 * Generate a new license key.
 */
export function generateLicenseKey(): string {
  return uuidv4();
}

export interface LicenseData {
  key: string;
  email: string;
  created: string;
  expires: string | null; // null = lifetime
  active: boolean;
}

/**
 * Create license data for a new purchase.
 */
export function createLicenseData(email: string): LicenseData {
  return {
    key: generateLicenseKey(),
    email,
    created: new Date().toISOString(),
    expires: null, // Lifetime license
    active: true,
  };
}
