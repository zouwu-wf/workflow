import React from "react";
import "./Button.css";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: "default" | "primary";
}

export function Button({ children, variant = "default", className = "", ...props }: ButtonProps) {
    const variantClass = variant === "primary" ? "win95-button-primary" : "";
    return (
        <button className={`win95-button ${variantClass} ${className}`.trim()} {...props}>
            {children}
        </button>
    );
}
