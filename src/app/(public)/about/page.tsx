export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold">关于</h1>
      <div className="prose prose-lg max-w-none">
        <p>
          AI Coding 是一个面向开发者的技术社区。在这里，你可以分享编程经验、
          探讨技术话题、交流 AI 与代码的无限可能。
        </p>
        <h2>社区特性</h2>
        <ul>
          <li>Markdown 编辑器 — 轻松撰写技术文章</li>
          <li>标签分类 — 快速找到感兴趣的话题</li>
          <li>讨论区 — 嵌套评论，深度交流</li>
          <li>全文搜索 — 快速检索社区内容</li>
          <li>响应式设计 — 随时随地参与讨论</li>
        </ul>
      </div>
    </div>
  );
}
