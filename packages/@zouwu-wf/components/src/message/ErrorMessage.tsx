import React from "react";
import { Button } from "../button";
import "./Message.css";

export interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorMessage({ message, onRetry, className = "" }: ErrorMessageProps) {
    return (
        <div className={`win95-error-message ${className}`.trim()}>
            <p>❌ {message}</p>
            {onRetry && (
                <Button onClick={onRetry} className="retry-btn">
                    重试
                </Button>
            )}
        </div>
    );
}
