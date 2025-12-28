import React from "react";
import { Button } from "@zouwu-wf/components";
import "./ValidationResultModal.css";

interface ValidationError {
    path: string;
    message: string;
    value?: any;
    schema?: string;
}

interface ValidationResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    valid: boolean;
    errors: ValidationError[];
    workflowName: string;
}

/**
 * 验证结果模态框组件
 * 显示工作流验证结果（成功或错误列表）
 */
function ValidationResultModal({
    isOpen,
    onClose,
    valid,
    errors,
    workflowName,
}: ValidationResultModalProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="validation-result-modal-overlay" onClick={onClose}>
            <div
                className="validation-result-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="validation-result-modal-header">
                    <h3>
                        {valid ? "✓ 验证通过" : "✗ 验证失败"}: {workflowName}
                    </h3>
                    <div className="validation-result-modal-actions">
                        <Button onClick={onClose}>关闭</Button>
                    </div>
                </div>

                <div className="validation-result-modal-body">
                    {valid ? (
                            <div className="validation-success">
                                <div className="success-icon">✓</div>
                                <div className="success-message">
                                    <h3>工作流验证通过</h3>
                                    <p>工作流定义符合规范，可以正常使用。</p>
                                </div>
                            </div>
                        ) : (
                            <div className="validation-errors">
                                <div className="errors-header">
                                    <h3>发现 {errors.length} 个验证错误</h3>
                                    <p>请修复以下错误后重试：</p>
                                </div>
                                <div className="errors-list">
                                    {errors.map((error, index) => (
                                        <div key={index} className="error-item">
                                            <div className="error-path">
                                                <strong>路径:</strong> {error.path || "root"}
                                            </div>
                                            <div className="error-message">
                                                <strong>错误:</strong> {error.message}
                                            </div>
                                            {error.value !== undefined && (
                                                <div className="error-value">
                                                    <strong>值:</strong>{" "}
                                                    <code>
                                                        {typeof error.value === "object"
                                                            ? JSON.stringify(error.value, null, 2)
                                                            : String(error.value)}
                                                    </code>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
}

export default ValidationResultModal;

