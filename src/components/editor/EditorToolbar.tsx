"use client";

import type { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor | null;
}

const buttons: { label: string; action: (editor: Editor) => void }[] = [
  { label: "B", action: (e) => (e.chain().focus() as any).toggleBold().run() },
  { label: "I", action: (e) => (e.chain().focus() as any).toggleItalic().run() },
  { label: "H1", action: (e) => (e.chain().focus() as any).toggleHeading({ level: 1 }).run() },
  { label: "H2", action: (e) => (e.chain().focus() as any).toggleHeading({ level: 2 }).run() },
  { label: "H3", action: (e) => (e.chain().focus() as any).toggleHeading({ level: 3 }).run() },
  { label: "UL", action: (e) => (e.chain().focus() as any).toggleBulletList().run() },
  { label: "OL", action: (e) => (e.chain().focus() as any).toggleOrderedList().run() },
  { label: "引用", action: (e) => (e.chain().focus() as any).toggleBlockquote().run() },
  { label: "</>", action: (e) => (e.chain().focus() as any).toggleCodeBlock().run() },
];

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 border-b p-2">
      {buttons.map(({ label, action }) => (
        <button
          key={label}
          type="button"
          onClick={() => action(editor)}
          className="rounded px-2 py-1 text-sm hover:bg-muted"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
