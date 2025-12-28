import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
            include: ["src/**/*"],
            exclude: [
                "src/**/*.test.ts",
                "src/**/*.test.tsx",
                "src/**/*.spec.ts",
                "src/**/*.spec.tsx",
            ],
        }),
    ],
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, "src/index.ts"),
                tree: resolve(__dirname, "src/tree/index.ts"),
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
            external: ["react", "react-dom", "react-arborist"],
            output: {
                globals: {
                    react: "React",
                    "react-dom": "ReactDOM",
                },
            },
        },
        sourcemap: true,
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
});
