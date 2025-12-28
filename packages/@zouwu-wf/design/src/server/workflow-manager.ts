import * as fs from "fs/promises";
import * as path from "path";
import { load } from "js-yaml";
import { glob } from "glob";
import * as yaml from "yaml";
import type { WorkflowInfo } from "../shared/types.js";

/**
 * 发现指定目录中的所有工作流文件
 */
export async function discoverWorkflows(workflowDir: string): Promise<WorkflowInfo[]> {
    try {
        // 确保目录存在，如果不存在则创建
        await fs.access(workflowDir).catch(async () => {
            console.log(`📁 工作流目录不存在，正在创建: ${workflowDir}`);
            await fs.mkdir(workflowDir, { recursive: true });
        });

        // 查找所有 .zouwu, .yml, .yaml 文件
        const pattern = path.join(workflowDir, "**/*.{zouwu,yml,yaml}").replace(/\\/g, "/");
        const files = await glob(pattern, {
            ignore: ["**/node_modules/**"],
        });

        const workflows: WorkflowInfo[] = [];

        for (const file of files) {
            try {
                const content = await fs.readFile(file, "utf-8");
                const workflow = load(content) as any;

                if (workflow && workflow.id) {
                    const stats = await fs.stat(file);
                    workflows.push({
                        id: workflow.id,
                        name: workflow.name || path.basename(file, path.extname(file)),
                        fileName: path.basename(file),
                        path: file,
                        version: workflow.version || "1.0.0",
                        description: workflow.description,
                        lastModified: stats.mtime.getTime(),
                    });
                }
            } catch (error) {
                console.warn(`⚠️  无法解析工作流文件 ${file}:`, error);
            }
        }

        return workflows.sort((a, b) => b.lastModified - a.lastModified);
    } catch (error) {
        console.error("❌ 扫描工作流目录失败:", error);
        return [];
    }
}

/**
 * 读取工作流文件
 */
export async function readWorkflow(workflowId: string, workflowDir: string): Promise<any> {
    const workflows = await discoverWorkflows(workflowDir);
    const workflow = workflows.find((w) => w.id === workflowId);

    if (!workflow) {
        throw new Error(`工作流不存在: ${workflowId}`);
    }

    const content = await fs.readFile(workflow.path, "utf-8");
    return load(content);
}

/**
 * 保存工作流文件
 */
export async function saveWorkflow(
    workflowId: string,
    workflowData: any,
    workflowDir: string,
): Promise<string> {
    const workflows = await discoverWorkflows(workflowDir);
    const workflow = workflows.find((w) => w.id === workflowId);

    if (!workflow) {
        throw new Error(`工作流不存在: ${workflowId}`);
    }

    // 更新更新时间戳
    workflowData.updatedAt = Date.now();

    const content = yaml.stringify(workflowData, { indent: 2 });
    await fs.writeFile(workflow.path, content, "utf-8");

    return workflow.path;
}

/**
 * 创建新工作流
 */
export async function createWorkflow(
    workflowData: {
        id: string;
        name: string;
        description?: string;
        version?: string;
    },
    workflowDir: string,
    subPath?: string,
): Promise<string> {
    // 确保目录存在
    await fs.access(workflowDir).catch(async () => {
        await fs.mkdir(workflowDir, { recursive: true });
    });

    // 构建文件路径
    const targetDir = subPath ? path.join(workflowDir, subPath) : workflowDir;
    await fs.mkdir(targetDir, { recursive: true });

    const fileName = `${workflowData.id}.zouwu`;
    const filePath = path.join(targetDir, fileName);

    // 检查文件是否已存在
    try {
        await fs.access(filePath);
        throw new Error(`工作流文件已存在: ${filePath}`);
    } catch (error: any) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }

    // 创建工作流对象
    const workflow: any = {
        id: workflowData.id,
        name: workflowData.name,
        description: workflowData.description || "",
        version: workflowData.version || "1.0.0",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        steps: [],
    };

    const content = yaml.stringify(workflow, { indent: 2 });
    await fs.writeFile(filePath, content, "utf-8");

    return filePath;
}

/**
 * 删除工作流
 */
export async function deleteWorkflow(workflowId: string, workflowDir: string): Promise<string> {
    const workflows = await discoverWorkflows(workflowDir);
    const workflow = workflows.find((w) => w.id === workflowId);

    if (!workflow) {
        throw new Error(`工作流不存在: ${workflowId}`);
    }

    await fs.unlink(workflow.path);
    return workflow.path;
}

/**
 * 获取工作流原始 YAML 内容
 */
export async function getWorkflowRaw(
    workflowId: string,
    workflowDir: string,
): Promise<{ content: string; path: string }> {
    const workflows = await discoverWorkflows(workflowDir);
    const workflow = workflows.find((w) => w.id === workflowId);

    if (!workflow) {
        throw new Error(`工作流不存在: ${workflowId}`);
    }

    const content = await fs.readFile(workflow.path, "utf-8");
    return { content, path: workflow.path };
}
