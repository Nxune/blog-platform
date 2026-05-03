"use client";

import type { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    editor.isActive(name, attrs);

  const run = (fn: () => boolean) => () => fn();

  return (
    <div className="flex flex-wrap gap-1 border-b p-2">
      {[
        {
          label: "B",
          action: () => editor.chain().focus().toggleBold().run(),
          active: isActive("bold"),
        },
        {
          label: "I",
          action: () => editor.chain().focus().toggleItalic().run(),
          active: isActive("italic"),
        },
        {
          label: "H1",
          action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          active: isActive("heading", { level: 1 }),
        },
        {
          label: "H2",
          action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          active: isActive("heading", { level: 2 }),
        },
        {
          label: "H3",
          action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          active: isActive("heading", { level: 3 }),
        },
        {
          label: "UL",
          action: () => editor.chain().focus().toggleBulletList().run(),
          active: isActive("bulletList"),
        },
        {
          label: "OL",
          action: () => editor.chain().focus().toggleOrderedList().run(),
          active: isActive("orderedList"),
        },
        {
          label: "引用",
          action: () => editor.chain().focus().toggleBlockquote().run(),
          active: isActive("blockquote"),
        },
        {
          label: "</>",
          action: () => editor.chain().focus().toggleCodeBlock().run(),
          active: isActive("codeBlock"),
        },
      ].map(({ label, action, active }) => (
        <button
          key={label}
          type="button"
          onClick={action}
          className={`rounded px-2 py-1 text-sm ${
            active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
