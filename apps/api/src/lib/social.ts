import { MAX_POST_GRAPHEMES, graphemeLength, isBlueskyConfigured, postToBluesky, type SharedPost } from "./bluesky.js";
import { FACEBOOK_MAX_CHARS, isFacebookConfigured, postToFacebook } from "./facebook.js";
import { INSTAGRAM_MAX_CHARS, isInstagramConfigured, postToInstagram } from "./instagram.js";

export const SITES = ["bluesky", "facebook", "instagram"] as const;
export type Site = (typeof SITES)[number];

export function isSite(value: string): value is Site {
  return (SITES as readonly string[]).includes(value);
}

interface SiteConfig {
  label: string;
  maxChars: number;
  needsPhoto: boolean;
  configured: () => boolean;
  post: (text: string, photoFilename: string | null) => Promise<SharedPost>;
}

export const SITE_CONFIG: Record<Site, SiteConfig> = {
  bluesky: {
    label: "Bluesky",
    maxChars: MAX_POST_GRAPHEMES,
    needsPhoto: false,
    configured: isBlueskyConfigured,
    post: postToBluesky,
  },
  facebook: {
    label: "Facebook",
    maxChars: FACEBOOK_MAX_CHARS,
    needsPhoto: false,
    configured: isFacebookConfigured,
    post: postToFacebook,
  },
  instagram: {
    label: "Instagram",
    maxChars: INSTAGRAM_MAX_CHARS,
    needsPhoto: true,
    configured: isInstagramConfigured,
    post: postToInstagram,
  },
};

export { graphemeLength };
