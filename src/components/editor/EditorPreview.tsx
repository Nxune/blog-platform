import { useMemo } from "react";

interface EditorPreviewProps {
  content: string;
}

export function EditorPreview({ content }: EditorPreviewProps) {
  const html = useMemo(() => {
    // Simple Markdown to HTML conversion for preview
    return content
      .split("\n")
      .map((line) => {
        if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
        if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
        if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
        if (line.startsWith("> ")) return `<blockquote>${line.slice(2)}</blockquote>`;
        if (line.startsWith("- ")) return `<li>${line.slice(2)}</li>`;
        if (line.startsWith("```")) return `<pre><code>${line.slice(3)}</code></pre>`;
        if (line === "") return "<br/>";
        return `<p>${line}</p>`;
      })
      .join("\n");
  }, [content]);

  if (!content) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        暂无内容
      </div>
    );
  }

  return (
    <div
      className="prose prose-sm max-w-none p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
