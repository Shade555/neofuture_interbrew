'use client';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="tooltip">
      {children}
      <div className="tooltip-content">{content}</div>
    </div>
  );
}
