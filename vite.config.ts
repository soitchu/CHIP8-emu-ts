import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  root: "website/src",
  build: {
    outDir: "../dist",
  },
  server: {
    port: 8080,
    strictPort: true,
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    }
  },
});