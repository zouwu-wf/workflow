import { describe, test, expect } from "vitest";
import { execSync } from "child_process";
import path from "path";

describe("TypeScript 编译", () => {
    test("应该通过 TypeScript 编译检查", () => {
        const rootDir = path.join(__dirname, "..");

        expect(() => {
            try {
                execSync("npx tsc --noEmit", {
                    cwd: rootDir,
                    stdio: "pipe",
                    encoding: "utf-8",
                });
            } catch (error: any) {
                // 如果错误信息包含类型错误，抛出更详细的错误
                if (error.stdout || error.stderr) {
                    const output = (error.stdout || error.stderr).toString();
                    throw new Error(`TypeScript 编译失败:\n${output}`);
                }
                throw error;
            }
        }).not.toThrow();
    });
});
