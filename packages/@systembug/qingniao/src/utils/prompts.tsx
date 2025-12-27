/**
 * 交互式提示工具（使用 ink）
 */

import React from "react";
import { render } from "ink";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { SelectList } from "../components/SelectList";

/**
 * 确认对话框
 */
export async function confirm(message: string, defaultValue = true): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        const instance = render(
            <ConfirmDialog
                message={message}
                defaultValue={defaultValue}
                onConfirm={async (confirmed) => {
                    instance.unmount();
                    // 等待一小段时间确保完全清理
                    await new Promise((r) => setTimeout(r, 50));
                    resolve(confirmed);
                }}
            />,
        );
    });
}

/**
 * 选择列表
 */
export async function select<T = string>(
    message: string,
    options: Array<{ label: string; value: T }>,
    defaultValue?: T,
): Promise<T> {
    return new Promise<T>((resolve) => {
        const instance = render(
            <SelectList
                message={message}
                options={options}
                defaultValue={defaultValue}
                onSelect={async (value) => {
                    instance.unmount();
                    // 等待一小段时间确保完全清理
                    await new Promise((r) => setTimeout(r, 50));
                    resolve(value);
                }}
            />,
        );
    });
}
