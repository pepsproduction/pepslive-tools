import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import prefixer from "postcss-prefix-selector";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const repositoryRoot = resolve(projectRoot, "../..");
const output = resolve(repositoryRoot, "assets/studio-v2");

export default defineConfig({
  root: projectRoot,
  base: "./",
  publicDir: resolve(projectRoot, "public"),
  css: {
    postcss: {
      plugins: [
        prefixer({
          prefix: ".peps-integrated-experience",
          transform(prefix, selector, prefixedSelector) {
            if (selector === ":root") return prefix;
            if (selector === "html" || selector === "body") return selector;
            return prefixedSelector;
          },
        }),
      ],
    },
  },
  build: {
    outDir: output,
    emptyOutDir: true,
    cssCodeSplit: false,
    target: "es2022",
    rollupOptions: {
      input: resolve(projectRoot, "src/production-entry.jsx"),
      output: {
        entryFileNames: "experience.js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (asset) =>
          asset.name?.endsWith(".css")
            ? "experience.css"
            : "assets/[name]-[hash][extname]",
      },
    },
  },
});
