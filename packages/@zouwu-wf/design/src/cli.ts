#!/usr/bin/env bun
import { program } from "commander";
import { startServer } from "./server/index.js";
import * as path from "path";
import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// 读取 package.json 获取版本
import packageJson from "../package.json" with { type: "json" };

program
    .name("zouwu-design")
    .description("🌌 驺吾工作流可视化设计服务器")
    .version(packageJson.version || "0.0.1")
    .option("-d, --dir <path>", "工作流文件目录路径", "./workflows")
    .option("-p, --port <number>", "服务器端口", "3000")
    .option("-h, --host <host>", "服务器主机", "localhost")
    .option("--open", "自动打开浏览器", false)
    .option("--watch", "监听文件变化（默认启用）", true)
    .action(async (options) => {
        const port = parseInt(options.port, 10);
        const host = options.host;
        const workflowDir = path.resolve(process.cwd(), options.dir);

        // 确保工作流目录存在
        try {
            const fs = await import("fs/promises");
            await fs.access(workflowDir).catch(async () => {
                console.log(`📁 工作流目录不存在，正在创建: ${workflowDir}`);
                await fs.mkdir(workflowDir, { recursive: true });
            });
        } catch (error) {
            console.error(`❌ 无法创建工作流目录: ${error}`);
            process.exit(1);
        }

        console.log("🌌 启动驺吾工作流可视化服务器...");
        console.log(`📁 工作流目录: ${workflowDir}`);
        console.log(`🌐 服务器地址: http://${host}:${port}`);

        try {
            await startServer({
                port,
                host,
                workflowDir,
                open: options.open,
                watch: options.watch,
            });
        } catch (error) {
            console.error("❌ 启动服务器失败:", error);
            process.exit(1);
        }
    });

program.parse();
