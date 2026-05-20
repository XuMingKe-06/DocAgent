import type { ReactNode } from "react";

interface MainAreaProps {
  workflow: ReactNode;
  inputArea: ReactNode;
}

export function MainArea({ workflow, inputArea }: MainAreaProps) {
  return (
    <>
      {/* 工作流区域 */}
      <div className="workflow-area flex-1 overflow-y-auto">
        {workflow}
      </div>

      {/* 输入框 */}
      {inputArea}
    </>
  );
}
