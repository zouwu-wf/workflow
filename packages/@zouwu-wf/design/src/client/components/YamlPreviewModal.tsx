import React, { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@zouwu-wf/components";
import "./YamlPreviewModal.css";

interface YamlPreviewModalProps {
    /** 是否显示模态框 */
    isOpen: boolean;
    /** YAML 内容 */
    yamlContent: string;
    /** 工作流名称 */
    workflowName?: string;
    /** 关闭模态框的回调 */
    onClose: () => void;
    /** 是否只读（默认 true） */
    readOnly?: boolean;
}

/**
 * YAML 预览模态框组件
 * 使用 Monaco Editor 显示和编辑 YAML 内容
 */
function YamlPreviewModal({
    isOpen,
    yamlContent,
    workflowName,
    onClose,
    readOnly = true,
}: YamlPreviewModalProps) {
    const [editorContent, setEditorContent] = useState(yamlContent);

    // 当 YAML 内容变化时更新编辑器内容
    useEffect(() => {
        setEditorContent(yamlContent);
    }, [yamlContent]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="yaml-preview-modal-overlay" onClick={onClose}>
            <div
                className="yaml-preview-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="yaml-preview-modal-header">
                    <h3>YAML 预览{workflowName ? `: ${workflowName}` : ""}</h3>
                    <div className="yaml-preview-modal-actions">
                        <Button onClick={onClose}>关闭</Button>
                    </div>
                </div>
                <div className="yaml-preview-modal-body">
                    <Editor
                        height="80vh"
                        defaultLanguage="yaml"
                        value={editorContent}
                        onChange={(value) => {
                            if (!readOnly) {
                                setEditorContent(value || "");
                            }
                        }}
                        options={{
                            readOnly,
                            minimap: { enabled: true },
                            fontSize: 14,
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                            automaticLayout: true,
                            tabSize: 2,
                            formatOnPaste: true,
                            formatOnType: true,
                        }}
                        theme="vs-dark"
                    />
                </div>
            </div>
        </div>
    );
}

export default YamlPreviewModal;

