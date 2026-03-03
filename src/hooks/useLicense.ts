"use client";

import { useState, useEffect, useCallback } from "react";

const LICENSE_KEY = "pdfcensor_license";

interface LicenseState {
  isPro: boolean;
  licenseKey: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useLicense() {
  const [state, setState] = useState<LicenseState>({
    isPro: false,
    licenseKey: null,
    isLoading: true,
    error: null,
  });

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LICENSE_KEY);
    if (stored) {
      setState({
        isPro: true,
        licenseKey: stored,
        isLoading: false,
        error: null,
      });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const activate = useCallback(async (key: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      const data = await response.json();

      if (data.valid) {
        localStorage.setItem(LICENSE_KEY, key);
        setState({
          isPro: true,
          licenseKey: key,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: data.error || "Invalid license key",
        }));
        return false;
      }
    } catch {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to validate license",
      }));
      return false;
    }
  }, []);

  const deactivate = useCallback(() => {
    localStorage.removeItem(LICENSE_KEY);
    setState({
      isPro: false,
      licenseKey: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return { ...state, activate, deactivate };
}
