import React from "react";
import "./Input.css";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    // 可以添加额外的 props
}

export function Input({ className = "", ...props }: InputProps) {
    return <input className={`win95-input ${className}`.trim()} {...props} />;
}
