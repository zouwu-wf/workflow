#!/usr/bin/env node

/**
 * 青鸟 CLI 入口
 *
 * 相见时难别亦难，东风无力百花残。
 * 春蚕到死丝方尽，蜡炬成灰泪始干。
 * 晓镜但愁云鬓改，夜吟应觉月光寒。
 * 蓬山此去无多路，青鸟殷勤为探看。
 * —— 李商隐《无题》
 */

import { Command } from "commander";
import { render } from "ink";
import { writeFileSync, existsSync } from "fs";
import { join } from "path";
import { generateConfigTemplate } from "./commands/init";
import React from "react";
import { Box, Text } from "ink";

const program = new Command();

program.name("qingniao").description("青鸟 - 零配置优先的通用发布工具").version("0.1.0");

// init 命令：生成配置文件
program
    .command("init")
    .description("生成青鸟配置文件模板（可选，零配置已足够）")
    .option("-f, --force", "强制覆盖已存在的配置文件")
    .option("--format <format>", "配置文件格式 (ts|js|json)", "ts")
    .action(async (options: { force?: boolean; format?: string }) => {
        const rootDir = process.cwd();
        const format = (options.format || "ts") as "ts" | "js" | "json";
        const configFileName = `qingniao.config.${format}`;
        const configPath = join(rootDir, configFileName);

        // 检查文件是否已存在
        if (existsSync(configPath) && !options.force) {
            const { unmount } = render(
                <Box flexDirection="column">
                    <Text color="yellow">⚠ 配置文件已存在: {configFileName}</Text>
                    <Text>使用 --force 选项可覆盖现有文件</Text>
                </Box>,
            );
            await unmount();
            process.exit(1);
        }

        // 使用 ink 显示进度
        let renderInstance: ReturnType<typeof render> | null = null;

        try {
            // 显示加载状态
            renderInstance = render(
                <Box flexDirection="column">
                    <Text color="cyan">⏳ 正在生成配置文件...</Text>
                </Box>,
            );

            const content = generateConfigTemplate(format);
            writeFileSync(configPath, content, "utf-8");

            // 重新渲染成功消息
            renderInstance = render(
                <Box flexDirection="column">
                    <Text color="green">✓ 配置文件已生成: {configFileName}</Text>
                    <Text> </Text>
                    <Text color="blue">💡 提示：</Text>
                    <Text> - 配置文件完全可选，青鸟支持零配置</Text>
                    <Text> - 只需配置需要覆盖自动检测的部分</Text>
                    <Text> - 删除配置文件即可恢复零配置模式</Text>
                </Box>,
            );

            await renderInstance.waitUntilExit();
        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorObj = error instanceof Error ? error : new Error(errorMessage);

            if (renderInstance) {
                renderInstance = render(
                    <Box flexDirection="column">
                        <Text color="red">✗ 生成配置文件失败: {errorMessage}</Text>
                    </Box>,
                );
                await renderInstance.waitUntilExit();
            }
            process.exit(1);
        }
    });

// 主命令：发布流程
program
    .option("-c, --config <path>", "指定配置文件路径")
    .option("--dry-run", "仅执行 dry-run")
    .option("--skip-version", "跳过版本更新")
    .option("--skip-build", "跳过构建检查")
    .option("--skip-publish", "跳过发布（仅执行版本更新和构建）")
    .option("-y, --yes", "跳过所有确认提示")
    .option("-v, --verbose", "详细输出")
    .option("-s, --silent", "静默模式")
    .action(
        async (options: {
            config?: string;
            dryRun?: boolean;
            skipVersion?: boolean;
            skipBuild?: boolean;
            skipPublish?: boolean;
            yes?: boolean;
            verbose?: boolean;
            silent?: boolean;
        }) => {
            // 加载配置（零配置自动检测）
            const { loadConfig } = await import("./config/loader");
            const config = await loadConfig(options.config);

            // 创建上下文
            const { createContext } = await import("./core/context");
            const context = createContext(config, [], process.cwd());

            // 执行发布流程
            const { executePublish } = await import("./core/executor.js");

            try {
                await executePublish(config, context, {
                    dryRun: options.dryRun,
                    skipVersion: options.skipVersion,
                    skipBuild: options.skipBuild,
                    skipPublish: options.skipPublish,
                    yes: options.yes,
                });

                // 显示成功消息
                render(
                    <Box flexDirection="column">
                        <Text color="green">✓ 发布流程成功完成</Text>
                    </Box>,
                );
            } catch (error: any) {
                const errorMessage = error instanceof Error ? error.message : String(error);

                // 显示错误消息（不显示堆栈跟踪）
                render(
                    <Box flexDirection="column">
                        <Text color="red">✗ {errorMessage}</Text>
                    </Box>,
                );
                process.exit(1);
            }
        },
    );

program.parse();
