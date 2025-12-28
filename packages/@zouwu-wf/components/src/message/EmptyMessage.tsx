import React from "react";
import { Button } from "../button";
import "./Message.css";

export interface EmptyMessageProps {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyMessage({
    message,
    actionLabel = "创建",
    onAction,
    className = "",
}: EmptyMessageProps) {
    return (
        <div className={`win95-empty-message ${className}`.trim()}>
            <p>{message}</p>
            {onAction && (
                <Button onClick={onAction} className="action-btn">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
