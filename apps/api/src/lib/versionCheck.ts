import type { VersionStatus } from "@printlib/shared";
import { APP_VERSION } from "../config.js";

const REPO = "Jonesie/printlib";
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

let status: VersionStatus = {
  current: APP_VERSION,
  latest: null,
  updateAvailable: false,
  releaseUrl: null,
};

function parseVersion(version: string): number[] {
  return version
    .replace(/^v/, "")
    .split(".")
    .map((part) => parseInt(part, 10) || 0);
}

export function isNewer(latest: string, current: string): boolean {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y;
  }
  return false;
}

async function checkForUpdate(): Promise<void> {
  // "dev" builds (from source, no release tag) have nothing meaningful to
  // compare against — every real version would look like a false-positive.
  if (APP_VERSION === "dev") return;

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return;

    const data = (await res.json()) as { tag_name?: string; html_url?: string };
    if (!data.tag_name) return;

    const latest = data.tag_name.replace(/^v/, "");
    status = {
      current: APP_VERSION,
      latest,
      updateAvailable: isNewer(latest, APP_VERSION),
      releaseUrl: data.html_url ?? `https://github.com/${REPO}/releases/tag/${data.tag_name}`,
    };
  } catch {
    // Offline, rate-limited, or GitHub unreachable — keep the last known status.
  }
}

export function getVersionStatus(): VersionStatus {
  return status;
}

export function startVersionCheckScheduler(): void {
  checkForUpdate();
  setInterval(checkForUpdate, CHECK_INTERVAL_MS).unref();
}
