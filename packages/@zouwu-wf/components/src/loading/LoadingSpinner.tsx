import React from "react";
import "./LoadingSpinner.css";

export interface LoadingSpinnerProps {
    size?: "small" | "medium" | "large";
    className?: string;
}

const sizeMap = {
    small: 16,
    medium: 32,
    large: 48,
};

export function LoadingSpinner({ size = "medium", className = "" }: LoadingSpinnerProps) {
    const spinnerSize = sizeMap[size];
    return (
        <div
            className={`win95-loading-spinner ${className}`.trim()}
            style={{ width: spinnerSize, height: spinnerSize }}
        />
    );
}
