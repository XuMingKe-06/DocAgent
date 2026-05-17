import type { ReactNode } from "react";

interface MainAreaProps {
  workflow: ReactNode;
  inputArea: ReactNode;
}

export function MainArea({ workflow, inputArea }: MainAreaProps) {
  return (
    <>
      {/* 工作流区域 */}
      <div className="flex-1 overflow-y-auto px-8 py-6 max-md:px-5 max-md:py-4">
        {workflow}
      </div>

      {/* 输入框 */}
      {inputArea}
    </>
  );
}
