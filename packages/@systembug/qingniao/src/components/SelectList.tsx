/**
 * 选择列表（使用 ink）
 */

import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

export interface SelectOption<T = string> {
    label: string;
    value: T;
}

export interface SelectListProps<T = string> {
    message: string;
    options: SelectOption<T>[];
    defaultValue?: T;
    onSelect: (value: T) => void;
}

export function SelectList<T = string>({
    message,
    options,
    defaultValue,
    onSelect,
}: SelectListProps<T>) {
    const defaultIndex = defaultValue ? options.findIndex((opt) => opt.value === defaultValue) : 0;
    const [selectedIndex, setSelectedIndex] = useState(defaultIndex >= 0 ? defaultIndex : 0);

    useInput((_input, key) => {
        if (key.upArrow) {
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        } else if (key.downArrow) {
            setSelectedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        } else if (key.return) {
            onSelect(options[selectedIndex].value);
        }
    });

    return (
        <Box flexDirection="column">
            <Text color="cyan">{message}</Text>
            <Text> </Text>
            {options.map((option, index) => (
                <Box key={String(option.value)}>
                    <Text color={index === selectedIndex ? "green" : "gray"}>
                        {index === selectedIndex ? "> " : "  "}
                        {option.label}
                    </Text>
                </Box>
            ))}
            <Text> </Text>
            <Text color="gray">使用 ↑↓ 键选择，Enter 确认</Text>
        </Box>
    );
}
