import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// The version shown in the page footer. Local/dev builds fall back to
// package.json's version; release builds override it via APP_VERSION,
// set from the git tag by the release workflow (see Dockerfile, which
// passes this through as a build ARG).
const appVersion = process.env.APP_VERSION || process.env.npm_package_version || "dev";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "PrintLib",
        short_name: "PrintLib",
        description: "Personal 3D printer model library",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
    }),
  ],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
