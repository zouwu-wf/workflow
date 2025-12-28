import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import { resolve } from "path";

// 前端构建配置（用于开发和生产构建）
const clientConfig = defineConfig({
    plugins: [
        react(),
        monacoEditorPlugin({
            languageWorkers: ["editorWorkerService", "typescript", "json", "html"],
        }),
    ],
    root: ".",
    build: {
        outDir: "dist/client",
        emptyOutDir: true,
        rollupOptions: {
            input: resolve(__dirname, "index.html"),
        },
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
            // 开发模式下直接从源码解析，避免需要重新构建依赖包
            // 注意：在生产构建时，如果 node_modules 中有构建后的包，Vite 会优先使用它们
            // 这样可以确保开发时使用源码（热更新），生产时使用优化后的构建包
            "@zouwu-wf/components": resolve(__dirname, "../components/src/index.ts"),
            "@zouwu-wf/graph": resolve(__dirname, "../graph/src/index.ts"),
        },
    },
    server: {
        port: 3001,
        strictPort: true, // 强制使用 3001，如果被占用则报错
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
                secure: false,
                ws: false,
                configure: (proxy, _options) => {
                    proxy.on("error", (err, _req, _res) => {
                        console.error("Vite 代理错误:", err);
                    });
                    proxy.on("proxyReq", (proxyReq, req, _res) => {
                        console.log(
                            `[Vite 代理] ${req.method} ${req.url} -> http://localhost:3000${req.url}`,
                        );
                    });
                    proxy.on("proxyRes", (proxyRes, req, _res) => {
                        console.log(`[Vite 代理响应] ${req.url} -> ${proxyRes.statusCode}`);
                    });
                },
            },
        },
    },
    optimizeDeps: {
        include: ["@zouwu-wf/components", "@zouwu-wf/graph", "react-arborist", "@monaco-editor/react"],
    },
});

// 库构建配置（用于导出）
const libConfig = defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
            include: ["src/**/*"],
            exclude: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/client/**/*"],
        }),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "ZouwuDesign",
            formats: ["es", "cjs"],
            fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
        },
        rollupOptions: {
            external: [
                "react",
                "react-dom",
                "reactflow",
                "zustand",
                "elysia",
                "@elysiajs/cors",
                "@elysiajs/static",
                "commander",
                "chokidar",
                "open",
                "yaml",
                "js-yaml",
                "glob",
                "@zouwu-wf/workflow",
            ],
            output: {
                globals: {
                    react: "React",
                    "react-dom": "ReactDOM",
                },
            },
        },
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
});

// 根据环境变量决定使用哪个配置
export default process.env.BUILD_CLIENT ? clientConfig : libConfig;
