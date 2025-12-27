/**
 * 交互式提示工具（使用 inquirer）
 */

import inquirer from "inquirer";

/**
 * 确认对话框
 */
export async function confirm(message: string, defaultValue = true): Promise<boolean> {
    const { confirmed } = await inquirer.prompt([
        {
            type: "confirm",
            name: "confirmed",
            message,
            default: defaultValue,
        },
    ]);
    return confirmed;
}

/**
 * 选择列表
 */
export async function select<T = string>(
    message: string,
    options: Array<{ label: string; value: T }>,
    defaultValue?: T,
): Promise<T> {
    const defaultIndex = defaultValue ? options.findIndex((opt) => opt.value === defaultValue) : 0;
    const { selectedValue } = await inquirer.prompt([
        {
            type: "rawlist",
            name: "selectedValue",
            message,
            choices: options.map((opt) => ({
                name: opt.label,
                value: opt.value,
            })),
            default: defaultIndex >= 0 ? defaultIndex + 1 : 1,
            pageSize: 10,
        },
    ]);
    return selectedValue;
}
