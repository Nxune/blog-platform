"use client";

import type { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor | null;
}

const buttons: { label: string; ariaLabel: string; action: (editor: Editor) => void }[] = [
  { label: "B", ariaLabel: "加粗", action: (e) => (e.chain().focus() as any).toggleBold().run() },
  { label: "I", ariaLabel: "斜体", action: (e) => (e.chain().focus() as any).toggleItalic().run() },
  { label: "H1", ariaLabel: "标题 1", action: (e) => (e.chain().focus() as any).toggleHeading({ level: 1 }).run() },
  { label: "H2", ariaLabel: "标题 2", action: (e) => (e.chain().focus() as any).toggleHeading({ level: 2 }).run() },
  { label: "H3", ariaLabel: "标题 3", action: (e) => (e.chain().focus() as any).toggleHeading({ level: 3 }).run() },
  { label: "UL", ariaLabel: "无序列表", action: (e) => (e.chain().focus() as any).toggleBulletList().run() },
  { label: "OL", ariaLabel: "有序列表", action: (e) => (e.chain().focus() as any).toggleOrderedList().run() },
  { label: "引用", ariaLabel: "引用", action: (e) => (e.chain().focus() as any).toggleBlockquote().run() },
  { label: "</>", ariaLabel: "代码块", action: (e) => (e.chain().focus() as any).toggleCodeBlock().run() },
];

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 border-b p-2">
      {buttons.map(({ label, ariaLabel, action }) => (
        <button
          key={label}
          type="button"
          onClick={() => action(editor)}
          className="rounded px-2 py-1 text-sm hover:bg-muted"
          aria-label={ariaLabel}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
