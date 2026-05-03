"use client";

import { useState, useCallback } from "react";
import { EditorToolbar } from "./EditorToolbar";
import { EditorPreview } from "./EditorPreview";

interface EditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

export function Editor({ initialContent = "", onChange, placeholder }: EditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isPreview, setIsPreview] = useState(false);

  const handleChange = useCallback(
    (value: string) => {
      setContent(value);
      onChange?.(value);
    },
    [onChange]
  );

  return (
    <div className="min-h-[400px] rounded-lg border">
      <div className="flex items-center justify-between border-b bg-muted/50 px-2">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={`rounded px-3 py-1.5 text-sm ${
              !isPreview ? "bg-background font-medium" : "hover:bg-muted"
            }`}
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={`rounded px-3 py-1.5 text-sm ${
              isPreview ? "bg-background font-medium" : "hover:bg-muted"
            }`}
          >
            预览
          </button>
        </div>
      </div>

      {isPreview ? (
        <EditorPreview content={content} />
      ) : (
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder ?? "开始写作..."}
          className="min-h-[360px] w-full resize-y border-none p-4 font-mono text-sm outline-none focus:ring-0"
        />
      )}
    </div>
  );
}
