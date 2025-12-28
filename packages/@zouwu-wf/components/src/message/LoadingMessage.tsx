import React from "react";
import { LoadingSpinner } from "../loading";
import "./Message.css";

export interface LoadingMessageProps {
    message?: string;
    className?: string;
}

export function LoadingMessage({ message = "加载中...", className = "" }: LoadingMessageProps) {
    return (
        <div className={`win95-loading-message ${className}`.trim()}>
            <LoadingSpinner size="medium" />
            {message && <p>{message}</p>}
        </div>
    );
}
