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
import { writeFileSync, existsSync } from "fs";
import { join } from "path";
import { generateConfigTemplate } from "./commands/init";
import ora from "ora";
import { createLogger } from "@systembug/diting";

// 创建 logger 实例
const logger = createLogger({
    context: "qingniao:cli",
    level: 1, // INFO
});

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
            logger.warn(`配置文件已存在: ${configFileName}`);
            logger.info("使用 --force 选项可覆盖现有文件");
            process.exit(1);
        }

        try {
            const spinner = ora("正在生成配置文件").start();
            const content = generateConfigTemplate(format);
            writeFileSync(configPath, content, "utf-8");
            spinner.succeed(`配置文件已生成: ${configFileName}`);

            logger.info("💡 提示：");
            logger.info(" - 配置文件完全可选，青鸟支持零配置");
            logger.info(" - 只需配置需要覆盖自动检测的部分");
            logger.info(" - 删除配置文件即可恢复零配置模式");
        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`生成配置文件失败: ${errorMessage}`, error);
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

                logger.info("✓ 发布流程成功完成");
            } catch (error: any) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(`✗ ${errorMessage}`, error);
                process.exit(1);
            }
        },
    );

program.parse();

