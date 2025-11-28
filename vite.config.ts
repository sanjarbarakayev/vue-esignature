import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    vue(),
    dts({
      insertTypesEntry: true,
      include: ["src/**/*.ts", "src/**/*.vue"],
      outDir: "dist",
      rollupTypes: true,
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "VueESignature",
      fileName: (format) =>
        `vue-esignature.${format === "es" ? "js" : "umd.cjs"}`,
    },
    rollupOptions: {
      external: ["vue"],
      output: {
        globals: {
          vue: "Vue",
        },
        exports: "named",
      },
    },
    sourcemap: true,
    minify: "terser",
  },
});
