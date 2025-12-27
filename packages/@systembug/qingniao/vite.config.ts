import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig({
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, "src/index.ts"),
                cli: resolve(__dirname, "src/cli.tsx"),
            },
            formats: ["es", "cjs"],
            fileName: (format, entryName) => {
                if (format === "es") {
                    return `${entryName}.mjs`;
                }
                return `${entryName}.cjs`;
            },
        },
        rollupOptions: {
            external: [
                "chalk",
                "commander",
                "ink",
                "react",
                "listr2",
                "pino",
                "pino-pretty",
                "fs",
                "path",
                "url",
                "child_process",
            ],
            output: {
                preserveModules: false,
                exports: "named",
            },
        },
        sourcemap: true,
        target: "es2020",
        minify: false,
    },
    plugins: [
        react(),
        dts({
            include: ["src/**/*.ts", "src/**/*.tsx"],
            exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/**/__tests__/**"],
            outDir: "dist",
            rollupTypes: true,
        }) as any,
    ],
});

