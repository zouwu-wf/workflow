/**
 * 包列表显示组件
 */
import React from "react";
import { Box, Text } from "ink";

export interface PackageListItem {
    name: string;
    version: string;
    path: string;
    private?: boolean;
}

export interface PackageListProps {
    packages: PackageListItem[];
    title?: string;
}

export function PackageList({ packages, title = "将被更新的包:" }: PackageListProps) {
    if (packages.length === 0) {
        return (
            <Box flexDirection="column">
                <Text color="yellow">⚠ 未找到任何包</Text>
            </Box>
        );
    }

    return (
        <Box flexDirection="column">
            <Text color="cyan">{title}</Text>
            <Text> </Text>
            {packages.map((pkg, index) => (
                <Box key={pkg.path}>
                    <Text color={pkg.private ? "gray" : "green"}>
                        {pkg.private ? "🔒 " : "📦 "}
                        {pkg.name}
                    </Text>
                    <Text color="gray"> @ {pkg.version}</Text>
                    {pkg.private && (
                        <Text color="gray" dimColor>
                            {" "}
                            (私有)
                        </Text>
                    )}
                </Box>
            ))}
            <Text> </Text>
            <Text color="gray">共 {packages.length} 个包将被更新版本号</Text>
        </Box>
    );
}
