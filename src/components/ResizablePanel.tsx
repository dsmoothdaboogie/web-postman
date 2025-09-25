import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange?: (width: number) => void;
  className?: string;
  resizeHandle?: 'left' | 'right';
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  initialWidth = 300,
  minWidth = 200,
  maxWidth = 600,
  onWidthChange,
  className = '',
  resizeHandle = 'right'
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Update width when initialWidth changes
  useEffect(() => {
    setWidth(initialWidth);
  }, [initialWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startXRef.current;
    const newWidth = resizeHandle === 'right' 
      ? startWidthRef.current + deltaX
      : startWidthRef.current - deltaX;
    
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    console.log('Resizing', { deltaX, newWidth, clampedWidth, resizeHandle });
    setWidth(clampedWidth);
    
    if (onWidthChange) {
      onWidthChange(clampedWidth);
    }
  }, [isResizing, minWidth, maxWidth, onWidthChange, resizeHandle]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Resize started', { resizeHandle, currentWidth: width });
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width, handleMouseMove, handleMouseUp, resizeHandle]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={panelRef}
      className={`resizable-panel ${className}`}
      style={{ width: `${width}px` }}
    >
      {children}
      
      {/* Resize Handle */}
      <div
        className={`resize-handle ${
          resizeHandle === 'right' ? 'right-0' : 'left-0'
        } ${isResizing ? 'opacity-100' : ''}`}
        onMouseDown={handleMouseDown}
        title={`Drag to resize ${resizeHandle === 'right' ? 'sidebar' : 'response panel'}`}
      />
    </div>
  );
};

export default ResizablePanel;