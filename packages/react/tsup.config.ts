import { defineConfig } from "tsup";
import { copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ["react", "react-dom"],
  onSuccess: async () => {
    copyFileSync(
      resolve(__dirname, "src/styles/variables.css"),
      resolve(__dirname, "dist/styles.css"),
    );
  },
});
