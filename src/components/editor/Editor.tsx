"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "./EditorToolbar";
import { EditorPreview } from "./EditorPreview";

interface EditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

export function Editor({ initialContent = "", onChange, placeholder }: EditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder ?? "开始写作...",
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none p-4 focus:outline-none min-h-[360px]",
        placeholder: placeholder ?? "开始写作...",
      },
    },
  });

  return (
    <div className="min-h-[400px] rounded-lg border">
      <div className="flex items-center justify-between border-b bg-muted/50 px-2">
        <EditorToolbar editor={editor} />
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
        <EditorPreview content={editor?.getHTML() ?? ""} />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}
