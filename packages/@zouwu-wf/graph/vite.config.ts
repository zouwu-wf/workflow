import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
    plugins: [
        dts({
            insertTypesEntry: true,
            include: ["src/**/*"],
            exclude: ["src/**/*.test.ts", "src/**/*.spec.ts"],
        }),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "WorkflowGraph",
            formats: ["es", "cjs"],
            fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
        },
        rollupOptions: {
            external: ["@zouwu-wf/workflow"],
            output: {
                globals: {},
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
