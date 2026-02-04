import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  root: __dirname,
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "../src"),
      "@playground": resolve(__dirname, "./src"),
      "@examples": resolve(__dirname, "../examples/components"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
