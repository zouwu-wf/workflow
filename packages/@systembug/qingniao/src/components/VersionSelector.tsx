/**
 * 版本类型选择器（使用 ink）
 */

import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

export interface VersionSelectorProps {
    onSelect: (versionType: "major" | "minor" | "patch") => void;
}

export function VersionSelector({ onSelect }: VersionSelectorProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const options: Array<{ value: "major" | "minor" | "patch"; label: string }> = [
        { value: "major", label: "Major (主版本号，不兼容的 API 修改)" },
        { value: "minor", label: "Minor (次版本号，向后兼容的功能新增)" },
        { value: "patch", label: "Patch (修订号，向后兼容的问题修复)" },
    ];

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
            <Text color="cyan">选择版本类型:</Text>
            <Text> </Text>
            {options.map((option, index) => (
                <Box key={option.value}>
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
