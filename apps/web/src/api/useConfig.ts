import { useEffect, useState } from "react";
import { api, type AppConfig } from "./client";

let pending: Promise<AppConfig> | null = null;

// Server-side operator settings, fetched once and shared. Null until loaded (or if the
// request fails), so config-gated UI stays hidden rather than flashing in.
export function useConfig(): AppConfig | null {
  const [config, setConfig] = useState<AppConfig | null>(null);
  useEffect(() => {
    pending ??= api.getConfig();
    pending.then(setConfig).catch(() => {
      pending = null;
    });
  }, []);
  return config;
}
