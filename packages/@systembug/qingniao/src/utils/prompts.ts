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
    const { selected } = await inquirer.prompt([
        {
            type: "list",
            name: "selected",
            message,
            choices: options.map((opt) => opt.label),
            default: defaultIndex >= 0 ? defaultIndex : 0,
        },
    ]);
    const selectedOption = options.find((opt) => opt.label === selected);
    return selectedOption?.value ?? options[0].value;
}

