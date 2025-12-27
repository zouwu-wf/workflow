/**
 * 统一的发布流程 UI 组件
 * 使用单一 Ink 实例管理所有 UI 状态
 */

import React from "react";
import { Box, Text } from "ink";
import { ConfirmDialog } from "./ConfirmDialog";
import { SelectList } from "./SelectList";
import { VersionSelector } from "./VersionSelector";
import { PackageList } from "./PackageList";

export type UIState =
    | { type: "idle" }
    | {
          type: "package-list";
          packages: Array<{ name: string; version: string; path: string; private?: boolean }>;
      }
    | {
          type: "confirm";
          message: string;
          defaultValue: boolean;
          onConfirm: (value: boolean) => void;
      }
    | {
          type: "select";
          message: string;
          options: Array<{ label: string; value: any }>;
          onSelect: (value: any) => void;
      }
    | { type: "version-selector"; onSelect: (value: "major" | "minor" | "patch") => void }
    | { type: "message"; message: string; color?: string }
    | { type: "success"; message: string };

export interface PublishUIProps {
    state: UIState;
}

export function PublishUI({ state }: PublishUIProps) {
    return (
        <Box flexDirection="column">
            {state.type === "idle" ? null : state.type === "package-list" ? (
                <PackageList packages={state.packages} />
            ) : state.type === "confirm" ? (
                <ConfirmDialog
                    message={state.message}
                    defaultValue={state.defaultValue}
                    onConfirm={state.onConfirm}
                />
            ) : state.type === "select" ? (
                <SelectList
                    message={state.message}
                    options={state.options}
                    onSelect={state.onSelect}
                />
            ) : state.type === "version-selector" ? (
                <VersionSelector onSelect={state.onSelect} />
            ) : state.type === "message" ? (
                <Text color={state.color || "white"}>{state.message}</Text>
            ) : state.type === "success" ? (
                <Text color="green">✓ {state.message}</Text>
            ) : null}
        </Box>
    );
}

/**
 * UI 管理器，用于在单一 Ink 实例中管理状态
 */
export class UIManager {
    private setState: ((state: UIState) => void) | null = null;

    /**
     * 初始化 UI 管理器
     */
    init(setState: (state: UIState) => void) {
        this.setState = setState;
    }

    /**
     * 显示包列表
     */
    showPackageList(
        packages: Array<{ name: string; version: string; path: string; private?: boolean }>,
    ) {
        if (this.setState) {
            this.setState({ type: "package-list", packages });
        }
    }

    /**
     * 显示确认对话框
     */
    async confirm(message: string, defaultValue = true): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            if (this.setState) {
                this.setState({
                    type: "confirm",
                    message,
                    defaultValue,
                    onConfirm: (value: boolean) => {
                        this.clear();
                        resolve(value);
                    },
                });
            } else {
                resolve(defaultValue);
            }
        });
    }

    /**
     * 显示选择列表
     */
    async select<T = string>(
        message: string,
        options: Array<{ label: string; value: T }>,
        defaultValue?: T,
    ): Promise<T> {
        return new Promise<T>((resolve) => {
            if (this.setState) {
                this.setState({
                    type: "select",
                    message,
                    options,
                    onSelect: (value: T) => {
                        this.clear();
                        resolve(value);
                    },
                });
            } else {
                resolve(defaultValue || options[0]?.value);
            }
        });
    }

    /**
     * 显示版本选择器
     */
    async selectVersion(): Promise<"major" | "minor" | "patch"> {
        return new Promise<"major" | "minor" | "patch">((resolve) => {
            if (this.setState) {
                this.setState({
                    type: "version-selector",
                    onSelect: (value: "major" | "minor" | "patch") => {
                        this.clear();
                        resolve(value);
                    },
                });
            } else {
                resolve("patch");
            }
        });
    }

    /**
     * 显示消息
     */
    showMessage(message: string, color?: string) {
        if (this.setState) {
            this.setState({ type: "message", message, color });
        }
    }

    /**
     * 显示成功消息
     */
    showSuccess(message: string) {
        if (this.setState) {
            this.setState({ type: "success", message });
        }
    }

    /**
     * 清空 UI
     */
    clear() {
        if (this.setState) {
            this.setState({ type: "idle" });
        }
    }
}
