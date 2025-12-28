import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { watch } from "chokidar";
import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
    discoverWorkflows,
    readWorkflow,
    saveWorkflow,
    createWorkflow,
    deleteWorkflow,
    getWorkflowRaw,
} from "./workflow-manager.js";
import { yamlToGraph, graphToYaml } from "@zouwu-wf/graph";
import type { ServerOptions } from "../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function startServer(options: ServerOptions) {
    const { port, host, workflowDir, open, watch: enableWatch } = options;

    let app: any = new Elysia().use(cors());

    // API 路由必须在静态文件服务之前注册，确保优先级
    app = app
        .get("/api/workflows", async ({ set }: any) => {
            set.headers["Content-Type"] = "application/json";
            const workflows = await discoverWorkflows(workflowDir);
            return {
                workflows,
                directory: workflowDir,
            };
        })
        .get("/api/workflows/:id", async ({ params, set }: any) => {
            set.headers["Content-Type"] = "application/json";
            try {
                const workflowYaml = await readWorkflow(params.id, workflowDir);
                const graph = yamlToGraph(workflowYaml);
                return {
                    workflow: workflowYaml,
                    graph,
                };
            } catch (err: any) {
                set.status = 404;
                return { error: err.message || "工作流不存在" };
            }
        })
        .get("/api/workflows/:id/raw", async ({ params, set }: any) => {
            try {
                const result = await getWorkflowRaw(params.id, workflowDir);
                return result;
            } catch (err: any) {
                set.status = 404;
                return { error: err.message || "工作流不存在" };
            }
        })
        .post("/api/workflows", async ({ body, set }: any) => {
            try {
                const { id, name, description, version, subPath } = body as any;

                if (!id || !name) {
                    set.status = 400;
                    return { error: "缺少必需字段: id 和 name" };
                }

                const filePath = await createWorkflow(
                    { id, name, description, version },
                    workflowDir,
                    subPath,
                );

                const workflow = await readWorkflow(id, workflowDir);
                return { workflow, filePath };
            } catch (err: any) {
                set.status = 400;
                return { error: err.message || "创建工作流失败" };
            }
        })
        .put("/api/workflows/:id", async ({ params, body, set }: any) => {
            try {
                const bodyData = body as any;

                // 如果传入的是图形数据，先转换为 YAML
                let workflowData: any;
                if (bodyData.graph) {
                    // 从图形转换为 YAML
                    const existingWorkflow = await readWorkflow(params.id, workflowDir).catch(
                        () => null,
                    );
                    workflowData = graphToYaml(bodyData.graph, existingWorkflow);
                } else {
                    // 直接使用传入的工作流数据
                    workflowData = bodyData;
                }

                if (!workflowData || !workflowData.id) {
                    set.status = 400;
                    return { error: "无效的工作流数据" };
                }

                if (workflowData.id !== params.id) {
                    set.status = 400;
                    return { error: "工作流 ID 不匹配" };
                }

                const filePath = await saveWorkflow(params.id, workflowData, workflowDir);
                const workflow = await readWorkflow(params.id, workflowDir);

                return { workflow, filePath };
            } catch (err: any) {
                set.status = 400;
                return { error: err.message || "保存工作流失败" };
            }
        })
        .delete("/api/workflows/:id", async ({ params, set }: any) => {
            try {
                const filePath = await deleteWorkflow(params.id, workflowDir);
                return { success: true, filePath };
            } catch (err: any) {
                set.status = 404;
                return { error: err.message || "删除工作流失败" };
            }
        })
        .get("/api/directory", async ({ set }: any) => {
            set.headers["Content-Type"] = "application/json";
            const workflows = await discoverWorkflows(workflowDir);
            return {
                path: workflowDir,
                workflows: workflows.length,
                lastScan: Date.now(),
            };
        });

    // 静态文件服务（如果前端已构建）- 必须在 API 路由之后
    const clientDir = "./dist/client";
    if (existsSync(clientDir)) {
        try {
            app = app.use(
                staticPlugin({
                    assets: clientDir,
                    prefix: "/",
                }),
            );
        } catch (error) {
            console.log("ℹ️  静态文件服务初始化失败，仅提供 API 服务");
        }
    } else {
        console.log("ℹ️  前端文件未找到，仅提供 API 服务");
    }

    // 根路径返回设计页面（HTML）- 必须在静态文件服务之后
    const htmlPath = join(__dirname, "index.html");
    let designPageHtml: string | null = null;

    if (existsSync(htmlPath)) {
        try {
            designPageHtml = readFileSync(htmlPath, "utf-8");
        } catch (error) {
            console.warn("无法读取设计页面 HTML:", error);
        }
    }

    app = app.get("/", ({ set }: any) => {
        if (designPageHtml) {
            set.headers["Content-Type"] = "text/html; charset=utf-8";
            return designPageHtml;
        }
        // 如果 HTML 文件不存在，返回简单的 HTML
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>驺吾工作流可视化设计工具</title>
    <style>
        body { font-family: system-ui; padding: 2rem; max-width: 800px; margin: 0 auto; }
        h1 { color: #667eea; }
        .api { background: #f5f5f5; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
    </style>
</head>
<body>
    <h1>🌌 驺吾工作流可视化设计工具</h1>
    <p>服务器运行中。前端界面正在开发中。</p>
    <div class="api">
        <h3>API 端点：</h3>
        <ul>
            <li><code>GET /api/workflows</code> - 获取工作流列表</li>
            <li><code>GET /api/directory</code> - 获取目录信息</li>
        </ul>
    </div>
</body>
</html>`;
    });

    // 启动服务器
    app.listen({
        port,
        hostname: host,
    });

    // 文件监听
    if (enableWatch) {
        const watcher = watch(`${workflowDir}/**/*.{zouwu,yml,yaml}`, {
            ignored: /node_modules/,
            persistent: true,
        });

        watcher.on("change", (filePath) => {
            console.log(`📝 检测到文件变化: ${filePath}`);
            // TODO: 通过 WebSocket 通知客户端
        });

        watcher.on("add", (filePath) => {
            console.log(`➕ 检测到新文件: ${filePath}`);
            // TODO: 通过 WebSocket 通知客户端
        });

        watcher.on("unlink", (filePath) => {
            console.log(`🗑️  文件已删除: ${filePath}`);
            // TODO: 通过 WebSocket 通知客户端
        });
    }

    console.log(`🚀 驺吾工作流可视化工具运行在 http://${host}:${port}`);

    if (open) {
        // 自动打开浏览器
        const { default: openBrowser } = await import("open");
        await openBrowser(`http://${host}:${port}`);
    }

    return app;
}
