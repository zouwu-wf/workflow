/**
 * 确认对话框（使用 ink）
 */

import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

export interface ConfirmDialogProps {
    message: string;
    defaultValue?: boolean;
    onConfirm: (confirmed: boolean) => void;
}

export function ConfirmDialog({ message, defaultValue = true, onConfirm }: ConfirmDialogProps) {
    const [selected, setSelected] = useState(defaultValue);

    useInput((_input, key) => {
        if (key.leftArrow || key.rightArrow) {
            setSelected((prev) => !prev);
        } else if (key.return) {
            onConfirm(selected);
        }
    });

    return (
        <Box flexDirection="column">
            <Text>{message}</Text>
            <Text> </Text>
            <Box>
                <Text color={selected ? "green" : "gray"}>
                    {selected ? "> " : "  "}
                    Yes
                </Text>
                <Text> </Text>
                <Text color={!selected ? "red" : "gray"}>
                    {!selected ? "> " : "  "}
                    No
                </Text>
            </Box>
            <Text> </Text>
            <Text color="gray">使用 ←→ 键选择，Enter 确认</Text>
        </Box>
    );
}
