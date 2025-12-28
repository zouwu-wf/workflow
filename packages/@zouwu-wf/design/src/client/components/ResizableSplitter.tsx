import React, { useRef, useEffect, useState, useCallback } from "react";
import "./ResizableSplitter.css";

interface ResizableSplitterProps {
    /** 左侧面板的最小宽度（像素） */
    minLeftWidth?: number;
    /** 右侧面板的最小宽度（像素） */
    minRightWidth?: number;
    /** 初始左侧面板宽度（像素） */
    initialLeftWidth?: number;
    /** 左侧面板内容 */
    left: React.ReactNode;
    /** 右侧面板内容 */
    right: React.ReactNode;
    /** 分割器方向：'vertical' 表示垂直分割（左右布局），'horizontal' 表示水平分割（上下布局） */
    direction?: "vertical" | "horizontal";
    /** 分割器宽度（像素） */
    splitterWidth?: number;
    /** 宽度变化回调 */
    onResize?: (leftWidth: number) => void;
}

/**
 * 可调整大小的分割器组件
 * 支持左右或上下布局，可以拖拽调整两个面板的大小
 */
function ResizableSplitter({
    minLeftWidth = 200,
    minRightWidth = 300,
    initialLeftWidth = 300,
    left,
    right,
    direction = "vertical",
    splitterWidth = 4,
    onResize,
}: ResizableSplitterProps) {
    const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const splitterRef = useRef<HTMLDivElement>(null);

    // 处理鼠标按下
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    // 处理鼠标移动
    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            let newLeftWidth: number;

            if (direction === "vertical") {
                // 垂直分割：计算相对于容器左边的距离
                const mouseX = e.clientX - containerRect.left;
                newLeftWidth = mouseX - splitterWidth / 2;
            } else {
                // 水平分割：计算相对于容器顶部的距离
                const mouseY = e.clientY - containerRect.top;
                newLeftWidth = mouseY - splitterWidth / 2;
            }

            // 限制在最小和最大宽度之间
            const containerSize =
                direction === "vertical" ? containerRect.width : containerRect.height;
            const maxLeftWidth = containerSize - minRightWidth - splitterWidth;

            newLeftWidth = Math.max(minLeftWidth, Math.min(newLeftWidth, maxLeftWidth));

            setLeftWidth(newLeftWidth);
            onResize?.(newLeftWidth);
        },
        [isDragging, minLeftWidth, minRightWidth, splitterWidth, direction, onResize],
    );

    // 处理鼠标释放
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // 添加全局事件监听
    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = direction === "vertical" ? "col-resize" : "row-resize";
            document.body.style.userSelect = "none";

            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp, direction]);

    const isVertical = direction === "vertical";

    return (
        <div
            ref={containerRef}
            className={`resizable-splitter ${isVertical ? "resizable-splitter-vertical" : "resizable-splitter-horizontal"}`}
        >
            <div
                className="resizable-splitter-left"
                style={{
                    [isVertical ? "width" : "height"]: `${leftWidth}px`,
                    [isVertical ? "minWidth" : "minHeight"]: `${minLeftWidth}px`,
                }}
            >
                {left}
            </div>
            <div
                ref={splitterRef}
                className="resizable-splitter-handle"
                style={{
                    [isVertical ? "width" : "height"]: `${splitterWidth}px`,
                }}
                onMouseDown={handleMouseDown}
            >
                <div className="resizable-splitter-handle-inner" />
            </div>
            <div
                className="resizable-splitter-right"
                style={{
                    [isVertical ? "minWidth" : "minHeight"]: `${minRightWidth}px`,
                }}
            >
                {right}
            </div>
        </div>
    );
}

export default ResizableSplitter;
